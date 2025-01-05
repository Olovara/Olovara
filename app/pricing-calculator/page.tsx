"use client";

import { useState } from "react";
export default function PricingCalculator() {

  const [hours, setHours] = useState<number>(0);
  const [wage, setWage] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);

  const sellingPrice =
    (hours * wage) + materialCost || 0;

  function handleReset() {
    setHours(0);
    setWage(0);
    setMaterialCost(0);
  }

  return (
    <div className=" min-h-screen w-full bg-[hsl(185,41%,84%)] flex justify-center items-center flex-col gap-10 p-2">
      <main className="bg-white  p-4 rounded-2xl flex flex-col md:flex-row gap-6 w-full max-w-[700px]">
        <div className="flex flex-col gap-8  md:w-1/2">
          <section className="flex gap-2 flex-col">
            {/* Hours */}
            <Label>Hours</Label>
            <div className="relative flex ">
              <input
                onChange={(e) => setHours(e.target.valueAsNumber)}
                className="text-right h-[32px] w-full bg-[hsl(189,41%,97%)] px-2 outline-strong-cyan rounded font-bold text-dark-cyan "
                type="number"
                value={hours}
              />
            </div>
          </section>

          <section className="flex gap-2 flex-col">
            {/* Wage */}
            <Label>Wage</Label>
            <div className="relative flex ">
              <input
                onChange={(e) => setWage(e.target.valueAsNumber)}
                className="text-right h-[32px] w-full bg-[hsl(189,41%,97%)] px-2 outline-strong-cyan rounded font-bold text-dark-cyan "
                type="number"
                value={wage}
              />
            </div>
          </section>

          <section className="flex gap-2 flex-col">
            {/* CostOfMaterials */}
            <Label>Cost of Materials</Label>
            <div className="relative flex ">
              <input
                onChange={(e) => setMaterialCost(e.target.valueAsNumber)}
                className="text-right h-[32px] w-full bg-[hsl(189,41%,97%)] px-2 outline-strong-cyan rounded font-bold text-dark-cyan "
                type="number"
                value={materialCost}
              />
            </div>
          </section>
        </div>

        <div className="bg-dark-cyan flex-col flex md:w-1/2 rounded-xl px-5 pt-8 pb-6  justify-between gap-6">
          <section className="flex flex-col gap-5">
            <PersonBill
              label="Selling Price"
              total={sellingPrice.toFixed(2)}
            />
          </section>

          {/* button  */}

          <button
            onClick={handleReset}
            className="w-full text-dark-cyan bg-strong-cyan rounded font-bold h-[38px] hover:bg-very-light-grayish-cyan "
          >
            {" "}
            RESET{" "}
          </button>
        </div>
      </main>
      {/* <p className=" text-dark-cyan">hello</p> */}
    </div>
  );
}

function Label(props: React.HtmlHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className="text-xs text-[hsl(186,14%,43%)] font-semibold "
    />
  );
}

type PersonBillType = {
  label: string;
  total: string;
};

function PersonBill(props: PersonBillType) {
  return (
    <div className="flex justify-between items-center">
      {/* left */}
      <div>
        <p className="text-white">{props.label}</p>
      </div>
      {/* right */}
      <p className="font-bold text-4xl text-strong-cyan">${props.total}</p>
    </div>
  );
}