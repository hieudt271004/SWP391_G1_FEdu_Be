import { useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { Cloud, Upload, FileText, Calendar, Clock } from 'lucide-react';

interface SubmissionHistoryItem {
  id: number;
  fileName: string;
  uploadedAt: string;
  status: string;
}

export function StudentMilestoneSubmissionPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const milestoneData = {
    title: 'Milestone 1: Project Proposal',
    dueDate: '2026-05-30',
    status: 'Not Submitted',
    courseName: 'SWP391',
    courseFullName: 'Software Development Project',
  };

  const submissionHistory: SubmissionHistoryItem[] = [
    {
      id: 1,
      fileName: 'project_proposal_draft_v1.pdf',
      uploadedAt: '2026-05-15 14:30',
      status: 'Reviewed',
    },
    {
      id: 2,
      fileName: 'project_proposal_draft_v2.pdf',
      uploadedAt: '2026-05-18 09:15',
      status: 'Reviewed',
    },
  ];

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      console.log('Submitting file:', selectedFile.name);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Not Submitted') return 'destructive';
    if (status === 'Submitted') return 'default';
    return 'secondary';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/student/dashboard" className="cursor-pointer">
              My Courses
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#" className="cursor-pointer">
              {milestoneData.courseName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Milestone 1</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{milestoneData.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  <span>Due: {formatDate(milestoneData.dueDate)}</span>
                </div>
              </div>
            </div>
            <Badge variant={getStatusColor(milestoneData.status)}>
              {milestoneData.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit Your Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-12 transition-colors
              ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
            `}
          >
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileSelect}
            />
            <div className="flex flex-col items-center justify-center gap-4 text-center pointer-events-none">
              <div className="rounded-full bg-muted p-4">
                <Cloud className="size-8 text-muted-foreground" />
              </div>
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <FileText className="size-5" />
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-base font-medium text-foreground">
                    Drag and drop your report file here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile}
              className="flex-1"
            >
              <Upload className="size-4" />
              Submit
            </Button>
            <Button onClick={handleCancel} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
        </CardHeader>
        <CardContent>
          {submissionHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No previous submissions
            </p>
          ) : (
            <div className="space-y-3">
              {submissionHistory.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="rounded-md bg-muted p-2 mt-0.5">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.fileName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          <span>{item.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
