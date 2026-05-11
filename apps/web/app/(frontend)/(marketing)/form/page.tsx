import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { IntakeFormBlock } from "@/app/components/marketing/shared/blocks/IntakeFormBlock";

export const metadata = {
  title: "Corporate Intake Brief — AstroNat",
  description:
    "Complete your corporate intelligence intake brief so we can map your incorporation chart against your strategic objectives.",
};

export default function FormPage() {
  return (
    <>
      <Navbar hideAuth={true} />
      <main>
        <IntakeFormBlock />
      </main>
      <Footer variant="b2b" />
    </>
  );
}
