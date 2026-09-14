import { Settings } from "lucide-react";
import { PageHeader, Card } from "../../components/ui/LakoliDesignSystem";

export default function Parametres() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres du compte"
        description="Gérez les informations de votre compte et les préférences de l'établissement."
      />
      <Card className="text-center py-12">
        <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-3 border border-blue-100">
          <Settings className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate-500">Module "Paramètres du compte" — en construction, bientôt connecté à l'API.</p>
      </Card>
    </div>
  );
}
