import EstimateStatusPage, {
  type EstimateStatusSearchParams,
} from "../estimate-status-page";

type ExpiredEstimatesPageProps = {
  searchParams: Promise<EstimateStatusSearchParams>;
};

export default function ExpiredEstimatesPage({
  searchParams,
}: ExpiredEstimatesPageProps) {
  return (
    <EstimateStatusPage
      status="expired"
      searchParams={searchParams}
    />
  );
}