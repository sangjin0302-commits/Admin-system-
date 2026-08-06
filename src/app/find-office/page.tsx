import { OfficeFinder } from "./office-finder";

export const revalidate = 3600; // ISR — 정적 콘텐츠, 함수호출 절감

export default function FindOfficePage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <div className="ui-kicker">Locations</div>
        <h1 className="ui-page-title">Find an ETHOS Office</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Allow location access to see distances to our nearest offices.
        </p>
      </div>
      <OfficeFinder />
    </div>
  );
}
