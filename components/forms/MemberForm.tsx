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
import { encryptName, decryptName } from "@/lib/encryption";

interface MemberFormProps {
  initialData: {
    encryptedFirstName: string;
    encryptedLastName: string;
    firstNameIV: string;
    lastNameIV: string;
    userBio: string;
    email: string;
    image: string;
  };
}

const MemberForm = ({ initialData }: MemberFormProps) => {
  const isClient = useIsClient();

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  // Decrypt the initial data
  const decryptedFirstName = decryptName(initialData.encryptedFirstName, initialData.firstNameIV);
  const decryptedLastName = decryptName(initialData.encryptedLastName, initialData.lastNameIV);

  const form = useForm<z.infer<typeof MemberSchema>>({
    resolver: zodResolver(MemberSchema),
    defaultValues: {
      firstName: decryptedFirstName,
      lastName: decryptedLastName,
      userBio: initialData.userBio,
      image: initialData.image,
    },
  });

  const onSubmit = async (values: z.infer<typeof MemberSchema>) => {
    // Encrypt the names before sending to the server
    const { encrypted: encryptedFirstName, iv: firstNameIV } = encryptName(values.firstName);
    const { encrypted: encryptedLastName, iv: lastNameIV } = encryptName(values.lastName);

    const encryptedData = {
      encryptedFirstName,
      encryptedLastName,
      firstNameIV,
      lastNameIV,
      userBio: values.userBio,
      image: values.image,
    };

    startTransition(async () => {
      try {
        const result = await memberInformation(encryptedData);
        if (result.success) setSuccess(result.success);
        if (result.error) setError(result.error);
      } catch (error) {
        setError("Failed to update member information");
      }
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
          <Input
            placeholder="First Name"
            {...form.register("firstName")}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Last Name</Label>
          <Input
            placeholder="Last Name"
            {...form.register("lastName")}
            disabled={isPending}
            type="text"
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Member Bio</Label>
          <Textarea
            placeholder="Type your bio here."
            {...form.register("userBio")}
            disabled={isPending}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Submitbutton title="Save" isPending={isPending} />
      </CardFooter>
    </form>
  );
};

export default MemberForm;
