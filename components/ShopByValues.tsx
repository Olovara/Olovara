import Link from "next/link";
import { Button } from "./ui/button";
import { shopValuesExtended } from "@/data/shop-values";

export function ShopByValues() {
  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Shop by Your Values</h2>
        <p className="text-muted-foreground">
          Support businesses that align with what matters to you
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {shopValuesExtended.map((value) => {
          const Icon = value.icon;
          return (
            <Link
              key={value.id}
              href={`/shops?values=${value.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow h-full flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/40 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {value.description}
                </p>
                <Button variant="ghost" className="mt-auto">
                  Shop {value.name}
                </Button>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
} 