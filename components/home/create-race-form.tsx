import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users2, Loader2, Camera, Image, User, Rocket } from "lucide-react";
import { FoodType } from "@/types/database";
import { useLanguage } from "@/contexts/language-context";

interface CreateRaceFormProps {
  playerName: string;
  setPlayerName: (val: string) => void;
  isTeamMode: boolean;
  setIsTeamMode: (val: boolean) => void;
  photoMode: "optional" | "mandatory";
  setPhotoMode: (val: "optional" | "mandatory") => void;
  canEnablePhotoMode: boolean;
  requireTerms: boolean;
  onTermsAccepted: (accepted: boolean) => void;
  selectedFood: FoodType | null;
  setSelectedFood: (val: FoodType) => void;
  foodTypes: any[];
  loading: boolean;
  onCreate: () => void;
  onBack: () => void;
}

export function CreateRaceForm({
  playerName,
  setPlayerName,
  isTeamMode,
  setIsTeamMode,
  photoMode,
  setPhotoMode,
  canEnablePhotoMode,
  requireTerms,
  onTermsAccepted,
  selectedFood,
  setSelectedFood,
  foodTypes,
  loading,
  onCreate,
  onBack,
}: CreateRaceFormProps) {
  const { t } = useLanguage();
  // Estado para controlar o checkbox
  const [agreed, setAgreed] = useState(false);
  const isOptional = photoMode === "optional";
  const isMandatory = photoMode === "mandatory";

  useEffect(() => {
    if (!requireTerms) {
      setAgreed(true);
    }
  }, [requireTerms]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="space-y-3">
        <Label
          htmlFor="playerName"
          className="text-xs uppercase font-bold text-muted-foreground px-1"
        >
          {t.home.codename_label}
        </Label>
        <Input
          id="playerName"
          placeholder={t.home.codename_placeholder}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={20}
          className="bg-background/50 h-14 text-lg font-medium"
        />
      </div>

      <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {t.home.modifiers}
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/80 bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setIsTeamMode(false)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all duration-200 ${
                !isTeamMode
                  ? "border-primary/50 bg-background text-primary shadow-sm ring-1 ring-primary/20"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              {t.home.free_for_all}
            </button>
            <button
              type="button"
              onClick={() => setIsTeamMode(true)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all duration-200 ${
                isTeamMode
                  ? "border-primary/50 bg-background text-primary shadow-sm ring-1 ring-primary/20"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <Users2 className="h-3.5 w-3.5" />
              {t.home.team_mode}
            </button>
          </div>
          <p className="text-[10px] uppercase text-muted-foreground">
            {isTeamMode ? t.home.team_mode_desc : t.home.free_for_all_desc}
          </p>
        </div>

        {canEnablePhotoMode && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/80 bg-muted/60 p-1">
              <button
                type="button"
                onClick={() => {
                  if (!isOptional) setAgreed(false);
                  setPhotoMode("optional");
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all duration-200 ${
                  isOptional
                    ? "border-primary/50 bg-background text-primary shadow-sm ring-1 ring-primary/20"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <Image className="h-3.5 w-3.5" />
                {t.home.photo_optional}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isMandatory) setAgreed(false);
                  setPhotoMode("mandatory");
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all duration-200 ${
                  isMandatory
                    ? "border-primary/50 bg-background text-primary shadow-sm ring-1 ring-primary/20"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                {t.home.photo_mandatory}
              </button>
            </div>
            <p className="text-[10px] uppercase text-muted-foreground">
              {isMandatory
                ? t.home.photo_mandatory_desc
                : t.home.photo_optional_desc}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label className="text-xs uppercase font-bold text-muted-foreground px-1">
          {t.home.category_label}
        </Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {foodTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setSelectedFood(type)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all ${
                selectedFood === type
                  ? "bg-primary text-white shadow-lg scale-105"
                  : "bg-background text-muted-foreground border border-transparent hover:border-primary/20"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CHECKBOX DE TERMOS E PRIVACIDADE */}
      {requireTerms && (
        <div
          className={`flex items-center gap-3 px-1 ${
            !agreed ? "rounded-lg border border-primary/40 p-2" : ""
          }`}
        >
          <input
            type="checkbox"
            id="terms-create"
            checked={agreed}
            onChange={(e) => {
              const value = e.target.checked;
              setAgreed(value);
              if (value) onTermsAccepted(true);
            }}
            className=" h-4 w-4 rounded border-primary text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <label
            htmlFor="terms-create"
            className="text-xs text-muted-foreground leading-tight cursor-pointer select-none"
          >
            {t.common.terms_pre_link}
            <Link
              href="/terms"
              className="underline hover:text-primary"
              target="_blank"
            >
              {t.common.terms_link}
            </Link>
            {t.common.privacy_connector}
            <Link
              href="/privacy"
              className="underline hover:text-primary"
              target="_blank"
            >
              {t.common.privacy_link}
            </Link>
            {t.common.terms_post_link}
          </label>
        </div>
      )}

      <div className="pt-2 space-y-4">
        <Button
          size="lg"
          className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 cursor-pointer"
          onClick={onCreate}
          disabled={
            !playerName.trim() ||
            !selectedFood ||
            loading ||
            (requireTerms && !agreed)
          }
        >
          {loading ? (
            <>
              {t.home.preparing}
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            </>
          ) : (
            <>
              {t.home.create_title}
              <Rocket className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 sm:h-14 rounded-xl font-semibold text-muted-foreground hover:text-primary"
          onClick={onBack}
        >
          {t.common.back}
        </Button>
      </div>
    </div>
  );
}
