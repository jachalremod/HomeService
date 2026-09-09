import EstimateStatusPage, {
  type EstimateStatusSearchParams,
} from "../estimate-status-page";

type AcceptedEstimatesPageProps = {
  searchParams: Promise<EstimateStatusSearchParams>;
};

export default function AcceptedEstimatesPage({
  searchParams,
}: AcceptedEstimatesPageProps) {
  return (
    <EstimateStatusPage
      status="accepted"
      searchParams={searchParams}
    />
  );
}