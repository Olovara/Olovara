"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Submitbutton } from "@/components/SubmitButtons";
import { useState, useTransition } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Spinner from "@/components/spinner";
import { Textarea } from "@/components/ui/textarea";
import { MemberSchema } from "@/schemas/MemberSchema";
import { memberInformation } from "@/actions/memberInformation";

const MemberForm = () => {
  const isClient = useIsClient();

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof MemberSchema>>({
    resolver: zodResolver(MemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      userBio: "",
    },
  });

  const onSubmit = (values: z.infer<typeof MemberSchema>) => {
    startTransition(() => {
      memberInformation(values).then((data) => {
        if (data.success) setSuccess(data.success);
        if (data?.error) setError(data.error);
      });
    });

    form.reset();
    setSuccess("");
    setError("");
  };

  if (!isClient) return <Spinner />;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <CardHeader>
        <CardTitle>Member Information</CardTitle>
        <CardDescription>Please fill in the information below</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <Label>First Name</Label>
          <Input placeholder="First Name"
            {...form.register("firstName")} // Link input to react-hook-form
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Last Name</Label>
          <Input placeholder="Last Name"
            {...form.register("lastName")} // Link input to react-hook-form
            disabled={isPending}
            type="text"
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Member Bio</Label>
          <Textarea placeholder="Type your bio here."
            {...form.register("userBio")} // Link input to react-hook-form
            disabled={isPending}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Submitbutton title="Submit" />
      </CardFooter>
    </form>
  );
};

export default MemberForm;