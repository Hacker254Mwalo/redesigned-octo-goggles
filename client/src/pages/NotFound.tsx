import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Compass, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f9f7f2] px-4 py-10 text-[#173b31]">
      <Card className="w-full max-w-lg border-[#d9d5ca] bg-white shadow-[0_20px_50px_rgba(23,59,49,0.10)]">
        <CardContent className="px-7 py-10 text-center sm:px-10 sm:py-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf1e8] text-[#17664f]">
            <Compass className="h-8 w-8" aria-hidden="true" />
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#cd6f5a]">MtaaMarket route guide</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-[#173b31]">This page is not here.</h1>

          <p className="mt-4 leading-7 text-[#4b6259]">
            It may have moved, or the address may be incomplete. Return to the Siaya market to browse approved products or send an item request.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="rounded-xl bg-[#17664f] px-6 py-2.5 text-white shadow-sm transition hover:bg-[#125440]"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to MtaaMarket
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
