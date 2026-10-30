"use client";

import React, { useState } from "react";
import { api, CosmeticAdverseEventResponse } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export const CosmeticSafetyCard: React.FC = () => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const [resultsData, setResultsData] = useState<CosmeticAdverseEventResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.searchCosmeticAdverseEvents(query.trim(), 5);
      setResultsData(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to search openFDA database.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#d1e5ec] p-6 sm:p-8 shadow-xs space-y-5">
      <div className="space-y-1 pb-4 border-b border-slate-100">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2b7f8f] bg-[#eaf4f8] px-3 py-1 rounded-full">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <span>{t.cosmeticSafetyTitle}</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          {language === "bn" ? "প্রসাধন সামগ্রী নিরাপত্তা অনুসন্ধান" : "Product Safety & Adverse Event Lookup"}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600">
          {t.cosmeticSafetyDesc}
        </p>
      </div>

      {/* Mandatory FDA Causation Disclaimer Alert */}
      <div className="p-3.5 rounded-2xl bg-[#eaf4f8] border border-[#cce4ee] text-slate-700 text-xs sm:text-sm flex items-start gap-2.5">
        <span className="material-symbols-outlined text-base text-[#2b7f8f] mt-0.5 shrink-0">
          info
        </span>
        <p className="leading-relaxed">
          <strong className="text-slate-900">{t.fdaDisclaimerNote}</strong>{" "}
          Reports in the FDA CAERS database are voluntarily submitted and unvalidated. They do not demonstrate a causal relationship.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand or product (e.g. CeraVe, Aveeno, Lotion)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#2b7f8f] focus:ring-1 focus:ring-[#2b7f8f] text-xs sm:text-sm text-slate-900 bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || query.trim().length < 2}
          className="px-5 py-2.5 rounded-xl bg-[#2b7f8f] hover:bg-[#236875] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:opacity-50 shrink-0"
        >
          {isLoading ? "Searching..." : t.searchProductBtn}
        </button>
      </form>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Results View */}
      {resultsData && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span>
              Query: <strong className="text-slate-800">{resultsData.query}</strong> • Total Reports:{" "}
              <strong className="text-slate-800">{resultsData.total_reports}</strong>
            </span>
            <a
              href={resultsData.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2b7f8f] hover:underline font-semibold"
            >
              openFDA CAERS Source ↗
            </a>
          </div>

          {resultsData.results.length > 0 ? (
            <div className="space-y-3">
              {resultsData.results.map((report, idx) => (
                <div
                  key={report.report_number || idx}
                  className="bg-[#f0f8fb] p-4 rounded-2xl border border-[#d1e5ec] space-y-2 text-xs sm:text-sm"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono">Report #{report.report_number || `CAERS-${idx + 1}`}</span>
                    <span>Received: {report.date_received || "Documented"}</span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Reported Products:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.products.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 text-xs font-medium"
                        >
                          {p.name} ({p.role})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Reported Reactions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.reported_reactions.map((rxn, rxnIdx) => (
                        <span
                          key={rxnIdx}
                          className="bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-rose-200"
                        >
                          {rxn}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 px-4 bg-[#f0f8fb] rounded-2xl border border-dashed border-[#d1e5ec] text-center">
              <p className="text-xs sm:text-sm text-slate-600">
                {resultsData.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

