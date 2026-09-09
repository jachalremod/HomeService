import EstimateStatusPage, {
  type EstimateStatusSearchParams,
} from "../estimate-status-page";

type SentEstimatesPageProps = {
  searchParams: Promise<EstimateStatusSearchParams>;
};

export default function SentEstimatesPage({
  searchParams,
}: SentEstimatesPageProps) {
  return (
    <EstimateStatusPage
      status="sent"
      searchParams={searchParams}
    />
  );
}