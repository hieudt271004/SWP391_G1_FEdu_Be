import { memo } from 'react';
import { RadioGroup, RadioGroupItem } from '../../../../components/ui/radio-group';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { Question } from '../../../../services/student.service';

export interface AnswerValue {
  selectedAnswerIds: number[];
  responseText: string;
}

interface QuestionFieldProps {
  question: Question;
  value: AnswerValue;
  onChange: (questionId: number, next: AnswerValue) => void;
  disabled?: boolean;
}



export const QuestionField = memo(function QuestionField({
  question,
  value,
  onChange,
  disabled,
}: QuestionFieldProps) {
  const { questionType, answers } = question;

  if (questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE') {
    const selected = value.selectedAnswerIds[0];
    return (
      <RadioGroup
        value={selected !== undefined ? String(selected) : undefined}
        onValueChange={(val) =>
          onChange(question.questionId, { ...value, selectedAnswerIds: [Number(val)] })
        }
        disabled={disabled}
      >
        {answers.map((a) => {
          const id = `q${question.questionId}-a${a.answerId}`;
          return (
            <div key={a.answerId} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-accent transition-colors">
              <RadioGroupItem value={String(a.answerId)} id={id} />
              <Label htmlFor={id} className="flex-1 cursor-pointer font-normal">
                {a.answerContent}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    );
  }

  if (questionType === 'MULTIPLE_SELECT') {
    const selectedSet = new Set(value.selectedAnswerIds);
    const toggle = (answerId: number, checked: boolean) => {
      const next = new Set(selectedSet);
      if (checked) next.add(answerId);
      else next.delete(answerId);
      onChange(question.questionId, { ...value, selectedAnswerIds: Array.from(next) });
    };
    return (
      <div className="grid gap-2">
        {answers.map((a) => {
          const id = `q${question.questionId}-a${a.answerId}`;
          return (
            <div key={a.answerId} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-accent transition-colors">
              <Checkbox
                id={id}
                checked={selectedSet.has(a.answerId)}
                onCheckedChange={(checked) => toggle(a.answerId, checked === true)}
                disabled={disabled}
              />
              <Label htmlFor={id} className="flex-1 cursor-pointer font-normal">
                {a.answerContent}
              </Label>
            </div>
          );
        })}
      </div>
    );
  }

  if (questionType === 'SHORT_ANSWER' || questionType === 'ESSAY') {
    return (
      <Textarea
        value={value.responseText}
        onChange={(e) => onChange(question.questionId, { ...value, responseText: e.target.value })}
        placeholder={questionType === 'ESSAY' ? 'Nhập bài làm của bạn...' : 'Nhập câu trả lời...'}
        rows={questionType === 'ESSAY' ? 6 : 2}
        disabled={disabled}
      />
    );
  }

  
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertDescription>
        Loại câu hỏi "{questionType}" chưa được hỗ trợ. Vui lòng báo giáo viên.
      </AlertDescription>
    </Alert>
  );
});

