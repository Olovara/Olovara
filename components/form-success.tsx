import { CheckCircledIcon } from "@radix-ui/react-icons";

type FormSuccessProps = {
  message?: string;
};

const FormSuccess = ({ message }: FormSuccessProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-brand-success-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-brand-success-700"
    >
      <CheckCircledIcon className="h-4 w-4 flex-none" aria-hidden />
      <p>{message}</p>
    </div>
  );
};

export default FormSuccess;