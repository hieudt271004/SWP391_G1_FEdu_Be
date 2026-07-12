import java.sql.*;
import java.util.*;

/**
 * Introspects the live PostgreSQL schema (public) and emits a PlantUML ERD
 * matching the style of diagram/erd.puml. Reads DB_URL / DB_USERNAME / DB_PASSWORD
 * from environment. Prints the .puml to stdout; diagnostics go to stderr.
 */
public class ErdDump {

    // Preferred table order to keep the generated layout close to the existing diagram.
    static final List<String> PREFERRED = Arrays.asList(
        "user_account", "roles", "user_role", "permissions", "role_permission", "tokens",
        "subjects", "classrooms", "classroom_subjects", "classroom_subject_students",
        "sub_mentor_student_assignment", "learning_paths", "learning_nodes", "node_materials",
        "videos", "files", "tests", "test_assignments", "test_assignment_students",
        "test_questions", "test_answers", "student_test_attempts", "student_test_responses",
        "student_selected_answers", "student_node_progress", "submissions", "node_questions",
        "question_answers", "node_reviews", "support_tickets"
    );

    static class Col {
        String name, dataType, udt, isNullable, colDefault;
        Integer charLen, numPrec, numScale;
        boolean pk, fk;
    }

    static Map<String, String> CONFIG = new HashMap<>();

    public static void main(String[] args) throws Exception {
        // Optional: load KEY=VALUE lines from a .env file passed as first arg.
        if (args.length >= 1) loadEnvFile(args[0]);

        String url = env("DB_URL");
        String user = envOr("DB_USERNAME", "neondb_owner");
        String pass = env("DB_PASSWORD");
        if (url == null || pass == null) {
            System.err.println("Missing DB_URL or DB_PASSWORD (env or .env file).");
            System.exit(2);
        }

        try (Connection c = DriverManager.getConnection(url, user, pass)) {
            List<String> tables = new ArrayList<>();
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT table_name FROM information_schema.tables " +
                    "WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) tables.add(rs.getString(1));
            }

            // Columns per table
            Map<String, LinkedHashMap<String, Col>> cols = new LinkedHashMap<>();
            for (String t : tables) cols.put(t, new LinkedHashMap<>());
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT table_name, column_name, data_type, udt_name, is_nullable, " +
                    "column_default, character_maximum_length, numeric_precision, numeric_scale " +
                    "FROM information_schema.columns WHERE table_schema='public' " +
                    "ORDER BY table_name, ordinal_position");
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String t = rs.getString("table_name");
                    if (!cols.containsKey(t)) continue;
                    Col col = new Col();
                    col.name = rs.getString("column_name");
                    col.dataType = rs.getString("data_type");
                    col.udt = rs.getString("udt_name");
                    col.isNullable = rs.getString("is_nullable");
                    col.colDefault = rs.getString("column_default");
                    col.charLen = (Integer) rs.getObject("character_maximum_length");
                    col.numPrec = (Integer) rs.getObject("numeric_precision");
                    col.numScale = (Integer) rs.getObject("numeric_scale");
                    cols.get(t).put(col.name, col);
                }
            }

            // Primary keys
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT tc.table_name, kcu.column_name " +
                    "FROM information_schema.table_constraints tc " +
                    "JOIN information_schema.key_column_usage kcu " +
                    "  ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema " +
                    "WHERE tc.table_schema='public' AND tc.constraint_type='PRIMARY KEY'");
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Col col = get(cols, rs.getString(1), rs.getString(2));
                    if (col != null) col.pk = true;
                }
            }

            // Foreign keys -> also collect relationships
            List<String[]> fks = new ArrayList<>(); // {childTable, childCol, parentTable}
            try (PreparedStatement ps = c.prepareStatement(
                    "SELECT tc.table_name AS child, kcu.column_name AS child_col, " +
                    "       ccu.table_name AS parent " +
                    "FROM information_schema.table_constraints tc " +
                    "JOIN information_schema.key_column_usage kcu " +
                    "  ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema " +
                    "JOIN information_schema.constraint_column_usage ccu " +
                    "  ON tc.constraint_name=ccu.constraint_name AND tc.table_schema=ccu.table_schema " +
                    "WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'");
                 ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String child = rs.getString("child");
                    String childCol = rs.getString("child_col");
                    String parent = rs.getString("parent");
                    Col col = get(cols, child, childCol);
                    if (col != null) col.fk = true;
                    fks.add(new String[]{child, childCol, parent});
                }
            }

            // Order tables: preferred first, then any extras alphabetically
            List<String> ordered = new ArrayList<>();
            for (String p : PREFERRED) if (cols.containsKey(p)) ordered.add(p);
            for (String t : tables) if (!ordered.contains(t)) ordered.add(t);

            // Output format: "puml" (default) or "drawio", chosen via 2nd CLI arg or FORMAT env.
            String fmt = args.length >= 2 ? args[1].toLowerCase()
                       : (env("FORMAT") != null ? env("FORMAT").toLowerCase() : "puml");
            String out = fmt.equals("drawio") ? buildDrawio(ordered, cols, fks)
                                              : buildPuml(ordered, cols, fks);
            System.out.print(out);
            System.err.println("Format: " + fmt + ", Tables: " + ordered.size() + ", FKs: " + fks.size());
        }
    }

    // ---- PlantUML emitter ----
    static String buildPuml(List<String> ordered,
                            Map<String, LinkedHashMap<String, Col>> cols,
                            List<String[]> fks) {
        StringBuilder sb = new StringBuilder();
        sb.append("@startuml\n\n!theme plain\nhide circle\nskinparam linetype ortho\n\n");

        for (String t : ordered) {
            sb.append("entity \"").append(t).append("\" as ").append(t).append(" {\n");
            LinkedHashMap<String, Col> cm = cols.get(t);
            // Layout: PK columns, divider, body columns (ordinal order),
            // then created_at/updated_at pushed to the bottom for readability.
            List<Col> pks = new ArrayList<>();
            List<Col> body = new ArrayList<>();
            List<Col> audit = new ArrayList<>();
            for (Col col : cm.values()) {
                if (col.pk) pks.add(col);
                else if (col.name.equals("created_at") || col.name.equals("updated_at")) audit.add(col);
                else body.add(col);
            }
            for (Col col : pks) sb.append("  ").append(line(col)).append("\n");
            sb.append("  --\n");
            for (Col col : body) sb.append("  ").append(line(col)).append("\n");
            for (Col col : audit) sb.append("  ").append(line(col)).append("\n");
            sb.append("}\n\n");
        }

        // Relationships. Group duplicate (parent,child) pairs; label with col if >1.
        sb.append("' Relationships\n");
        Map<String, List<String[]>> byPair = new LinkedHashMap<>();
        for (String[] fk : fks) {
            String key = fk[2] + "|" + fk[0];
            byPair.computeIfAbsent(key, k -> new ArrayList<>()).add(fk);
        }
        Set<String> emitted = new LinkedHashSet<>();
        for (Map.Entry<String, List<String[]>> e : byPair.entrySet()) {
            List<String[]> group = e.getValue();
            boolean label = group.size() > 1;
            for (String[] fk : group) {
                String parent = fk[2], child = fk[0], col = fk[1];
                String rel = parent + " ||--o{ " + child + (label ? " : \"" + col + "\"" : "");
                if (emitted.add(rel)) sb.append(rel).append("\n");
            }
        }
        sb.append("\n@enduml\n");
        return sb.toString();
    }

    // ---- draw.io (mxGraph XML) emitter ----
    // Each table is a stackLayout swimlane (header + one text row per column);
    // FKs become entity-relation edges. Tables are packed into columns by
    // shortest-column-first so nothing overlaps; open the .drawio and re-layout
    // (Arrange > Layout) or drag as needed.
    static String buildDrawio(List<String> ordered,
                              Map<String, LinkedHashMap<String, Col>> cols,
                              List<String[]> fks) {
        final int NCOLS = 6;
        final int HGAP = 140, VGAP = 80, ROW_H = 20, HEADER_H = 26;

        Map<String, List<String>> labels = new LinkedHashMap<>();
        Map<String, Double> widthOf = new LinkedHashMap<>();
        Map<String, Double> heightOf = new LinkedHashMap<>();
        for (String t : ordered) {
            LinkedHashMap<String, Col> cm = cols.get(t);
            List<Col> pks = new ArrayList<>(), body = new ArrayList<>(), audit = new ArrayList<>();
            for (Col c : cm.values()) {
                if (c.pk) pks.add(c);
                else if (c.name.equals("created_at") || c.name.equals("updated_at")) audit.add(c);
                else body.add(c);
            }
            List<String> ls = new ArrayList<>();
            int maxChars = t.length();
            for (List<Col> grp : Arrays.asList(pks, body, audit))
                for (Col c : grp) {
                    String l = drawioLabel(c);
                    ls.add(l);
                    maxChars = Math.max(maxChars, l.length());
                }
            labels.put(t, ls);
            widthOf.put(t, Math.max(160.0, Math.min(340.0, maxChars * 7 + 24)));
            heightOf.put(t, (double) (HEADER_H + ls.size() * ROW_H));
        }

        // Pass 1: pack tables into NCOLS columns, each new table into the shortest column.
        double[] colY = new double[NCOLS];
        double[] colMaxW = new double[NCOLS];
        int[] colOf = new int[ordered.size()];
        double[] yOf = new double[ordered.size()];
        for (int i = 0; i < ordered.size(); i++) {
            String t = ordered.get(i);
            int best = 0;
            for (int c = 1; c < NCOLS; c++) if (colY[c] < colY[best]) best = c;
            colOf[i] = best;
            yOf[i] = colY[best];
            colY[best] += heightOf.get(t) + VGAP;
            colMaxW[best] = Math.max(colMaxW[best], widthOf.get(t));
        }
        // Pass 2: x offset per column from the widest table in each preceding column.
        double[] colX = new double[NCOLS];
        for (int c = 1; c < NCOLS; c++) colX[c] = colX[c - 1] + colMaxW[c - 1] + HGAP;

        String tStyle = "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;"
            + "horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;"
            + "collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;";
        String rStyle = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
            + "spacingLeft=6;spacingRight=6;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];"
            + "portConstraint=eastwest;whiteSpace=wrap;html=1;";
        String eStyle = "edgeStyle=entityRelationEdgeStyle;fontSize=10;html=1;endArrow=ERmany;"
            + "startArrow=ERone;rounded=0;strokeColor=#9AA5B1;";

        StringBuilder sb = new StringBuilder();
        sb.append("<mxfile host=\"app.diagrams.net\">\n");
        sb.append("  <diagram id=\"erd\" name=\"ERD (live)\">\n");
        sb.append("    <mxGraphModel dx=\"1200\" dy=\"800\" grid=\"1\" gridSize=\"10\" guides=\"1\" ")
          .append("tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" ")
          .append("pageWidth=\"1600\" pageHeight=\"1200\" math=\"0\" shadow=\"0\">\n");
        sb.append("      <root>\n");
        sb.append("        <mxCell id=\"0\" />\n");
        sb.append("        <mxCell id=\"1\" parent=\"0\" />\n");

        for (int i = 0; i < ordered.size(); i++) {
            String t = ordered.get(i);
            double w = widthOf.get(t);
            sb.append("        <mxCell id=\"t_").append(t).append("\" value=\"").append(esc(t))
              .append("\" style=\"").append(tStyle).append("\" vertex=\"1\" parent=\"1\">\n");
            sb.append("          <mxGeometry x=\"").append((int) colX[colOf[i]])
              .append("\" y=\"").append((int) yOf[i]).append("\" width=\"").append((int) w)
              .append("\" height=\"").append(heightOf.get(t).intValue())
              .append("\" as=\"geometry\" />\n");
            sb.append("        </mxCell>\n");
            List<String> ls = labels.get(t);
            for (int r = 0; r < ls.size(); r++) {
                sb.append("        <mxCell id=\"t_").append(t).append("_r").append(r)
                  .append("\" value=\"").append(esc(ls.get(r))).append("\" style=\"").append(rStyle)
                  .append("\" vertex=\"1\" parent=\"t_").append(t).append("\">\n");
                sb.append("          <mxGeometry y=\"").append(HEADER_H + r * ROW_H)
                  .append("\" width=\"").append((int) w).append("\" height=\"").append(ROW_H)
                  .append("\" as=\"geometry\" />\n");
                sb.append("        </mxCell>\n");
            }
        }

        int ei = 0;
        Set<String> seen = new LinkedHashSet<>();
        for (String[] fk : fks) {
            String child = fk[0], col = fk[1], parent = fk[2];
            if (!seen.add(parent + "|" + child + "|" + col)) continue;
            // No edge label (FK column is already visible inside the table) to reduce clutter.
            sb.append("        <mxCell id=\"e").append(ei++).append("\" value=\"\"")
              .append(" style=\"").append(eStyle).append("\" edge=\"1\" parent=\"1\" source=\"t_")
              .append(parent).append("\" target=\"t_").append(child).append("\">\n");
            sb.append("          <mxGeometry relative=\"1\" as=\"geometry\" />\n");
            sb.append("        </mxCell>\n");
        }

        sb.append("      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>\n");
        return sb.toString();
    }

    static String drawioLabel(Col col) {
        List<String> tags = new ArrayList<>();
        if (col.pk) tags.add("PK");
        if (col.fk) tags.add("FK");
        String tag = tags.isEmpty() ? "" : String.join("/", tags) + "  ";
        return tag + col.name + " : " + mapType(col);
    }

    static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    static Col get(Map<String, LinkedHashMap<String, Col>> cols, String t, String c) {
        LinkedHashMap<String, Col> m = cols.get(t);
        return m == null ? null : m.get(c);
    }

    static String line(Col col) {
        String prefix = "NO".equals(col.isNullable) ? "* " : "";
        String type = mapType(col);
        List<String> tags = new ArrayList<>();
        if (col.pk) tags.add("PK");
        if (col.fk) tags.add("FK");
        String tag = tags.isEmpty() ? "" : " [" + String.join(", ", tags) + "]";
        return prefix + col.name + " : " + type + tag;
    }

    static String mapType(Col col) {
        String dt = col.dataType;
        boolean serial = col.colDefault != null && col.colDefault.startsWith("nextval(");
        switch (dt) {
            case "bigint":   return serial ? "BIGSERIAL" : "BIGINT";
            case "integer":  return serial ? "SERIAL" : "INT";
            case "smallint": return serial ? "SMALLSERIAL" : "SMALLINT";
            case "character varying": return col.charLen != null ? "VARCHAR(" + col.charLen + ")" : "VARCHAR";
            case "character": return col.charLen != null ? "CHAR(" + col.charLen + ")" : "CHAR";
            case "text": return "TEXT";
            case "boolean": return "BOOLEAN";
            case "date": return "DATE";
            case "timestamp without time zone": return "TIMESTAMP";
            case "timestamp with time zone": return "TIMESTAMPTZ";
            case "time without time zone": return "TIME";
            case "numeric":
                if (col.numPrec != null) {
                    return col.numScale != null && col.numScale > 0
                        ? "DECIMAL(" + col.numPrec + "," + col.numScale + ")"
                        : "DECIMAL(" + col.numPrec + ")";
                }
                return "DECIMAL";
            case "double precision": return "DOUBLE";
            case "real": return "REAL";
            case "json": return "JSON";
            case "jsonb": return "JSONB";
            case "bytea": return "BYTEA";
            case "uuid": return "UUID";
            case "USER-DEFINED": return col.udt;  // enum type name, e.g. e_user_status
            default: return dt.toUpperCase();
        }
    }

    static void loadEnvFile(String path) throws Exception {
        java.nio.file.Path p = java.nio.file.Paths.get(path);
        if (!java.nio.file.Files.exists(p)) {
            System.err.println("env file not found: " + path);
            return;
        }
        for (String raw : java.nio.file.Files.readAllLines(p)) {
            String s = raw.trim();
            if (s.isEmpty() || s.startsWith("#")) continue;
            int eq = s.indexOf('=');
            if (eq <= 0) continue;
            String k = s.substring(0, eq).trim();
            String v = s.substring(eq + 1).trim();
            if (v.length() >= 2 && ((v.startsWith("\"") && v.endsWith("\"")) ||
                                     (v.startsWith("'") && v.endsWith("'")))) {
                v = v.substring(1, v.length() - 1);
            }
            CONFIG.put(k, v);
        }
    }

    static String env(String k) {
        String v = System.getenv(k);
        if (v == null || v.isEmpty()) v = CONFIG.get(k);
        return (v == null || v.isEmpty()) ? null : v;
    }
    static String envOr(String k, String def) {
        String v = env(k);
        return v == null ? def : v;
    }
}
