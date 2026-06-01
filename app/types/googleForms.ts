// Google Forms API Response Types
export interface GoogleFormsResponse {
  formId: string;
  info?: {
    title?: string;
    description?: string;
  };
  items: FormItem[];
  settings: FormSettings;
}

export interface FormItem {
  itemId: string;
  title: string;
  questionItem?: {
    question: {
      required?: boolean;
      grading?: {
        pointValue: number;
        correctAnswers?: {
          answers: Array<{
            value: string;
          }>;
        };
        whenWrong?: {
          text: string;
        };
      };
      choiceQuestion?: {
        options: Array<{
          value: string;
        }>;
        type?: string;
      };
      textQuestion?: {
        paragraph?: boolean;
      };
    };
  };
}

export interface FormSettings {
  quizSettings?: {
    isQuiz: boolean;
  };
}
