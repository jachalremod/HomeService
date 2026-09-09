import EstimateStatusPage, {
  type EstimateStatusSearchParams,
} from "../estimate-status-page";

type DeletedEstimatesPageProps = {
  searchParams: Promise<EstimateStatusSearchParams>;
};

export default function DeletedEstimatesPage({
  searchParams,
}: DeletedEstimatesPageProps) {
  return (
    <EstimateStatusPage
      status="deleted"
      searchParams={searchParams}
    />
  );
}