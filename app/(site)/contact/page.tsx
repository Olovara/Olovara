import ContactUsForm from "@/components/forms/ContactUsForm";
import React from "react";

export default function ContactUs() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-brand-light-neutral-25">
      <div className="flex items-center justify-center px-2 sm:px-4 py-16">
        <ContactUsForm />
      </div>
    </div>
  );
}
