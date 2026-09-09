import EstimateStatusPage, {
  type EstimateStatusSearchParams,
} from "../estimate-status-page";

type DeclinedEstimatesPageProps = {
  searchParams: Promise<EstimateStatusSearchParams>;
};

export default function DeclinedEstimatesPage({
  searchParams,
}: DeclinedEstimatesPageProps) {
  return (
    <EstimateStatusPage
      status="declined"
      searchParams={searchParams}
    />
  );
}