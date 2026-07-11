package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportStudentsResult {
    @Builder.Default
    private int totalRows = 0;
    
    @Builder.Default
    private int created = 0;
    
    @Builder.Default
    private int enrolled = 0;
    
    @Builder.Default
    private int skipped = 0;
    
    @Builder.Default
    private int failed = 0;
    @Builder.Default
    private List<ImportRowError> errors = new ArrayList<>();
}
