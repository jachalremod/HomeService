import EstimateStatusPage, {
  type EstimateStatusSearchParams,
} from "../estimate-status-page";

type DraftEstimatesPageProps = {
  searchParams: Promise<EstimateStatusSearchParams>;
};

export default function DraftEstimatesPage({
  searchParams,
}: DraftEstimatesPageProps) {
  return (
    <EstimateStatusPage
      status="draft"
      searchParams={searchParams}
    />
  );
}