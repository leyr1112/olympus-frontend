import { t } from "@lingui/macro";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { CSSProperties, useMemo, useState } from "react";
import Chart, { DataFormat } from "src/components/Chart/Chart";
import { getSubgraphUrl } from "src/constants";
import {
  KeyMetricsDocument,
  MarketValueMetricsComponentsDocument,
  MarketValueMetricsDocument,
  ProtocolOwnedLiquidityComponentsDocument,
  useKeyMetricsQuery,
  useMarketValueMetricsComponentsQuery,
  useMarketValueMetricsQuery,
  useProtocolOwnedLiquidityComponentsQuery,
} from "src/generated/graphql";
import { formatCurrency } from "src/helpers";
import {
  getCategoriesMap,
  getColoursMap,
  getDataKeysFromTokens,
  getKeysTokenSummary,
  getTokensFromKey,
  MetricRow,
  reduceKeysTokenSummary,
} from "src/helpers/ProtocolMetricsHelper";

import { itemType, tooltipInfoMessages } from "../../treasuryData";
import { ChartCard } from "./ChartCard";

// These constants are used by charts to have consistent colours
const defaultColors: string[] = ["#FFBF00", "#FF7F50", "#DE3163", "#9FE2BF", "#40E0D0", "#6495ED", "#CCCCFF"];
const defaultBulletpointColours: CSSProperties[] = defaultColors.map(value => {
  return {
    background: value,
  };
});
export const defaultRecordsCount = 90;

const getSubgraphQueryExplorerUrl = (queryDocument: string): string => {
  return `${getSubgraphUrl()}/graphql?query=${encodeURIComponent(queryDocument)}`;
};

type GraphProps = {
  count?: number;
};

/**
 * React Component that displays a line graph comparing the
 * OHM price and liquid backing per floating OHM.
 *
 * @returns
 */
export const LiquidBackingPerOhmComparisonGraph = ({ count = defaultRecordsCount }: GraphProps) => {
  const { data } = useKeyMetricsQuery({ endpoint: getSubgraphUrl() }, { records: count });
  const queryExplorerUrl = getSubgraphQueryExplorerUrl(KeyMetricsDocument);

  const itemNames = [t`OHM Price`, t`Liquid Backing per Floating OHM`];
  const dataKeys = ["ohmPrice", "treasuryLiquidBackingPerOhmFloating"];
  const categoriesMap = getCategoriesMap(itemNames, dataKeys);
  const colorsMap = getColoursMap(defaultBulletpointColours, dataKeys);

  return (
    <Chart
      type="composed"
      data={data ? data.protocolMetrics : []}
      dataKey={dataKeys}
      itemType={itemType.dollar}
      color={""}
      stopColor={[[]]}
      stroke={defaultColors}
      headerText={t`OHM Backing`}
      headerSubText={`${data && formatCurrency(data.protocolMetrics[0].treasuryLiquidBackingPerOhmFloating, 2)}`}
      dataFormat={DataFormat.Currency}
      bulletpointColors={colorsMap}
      categories={categoriesMap}
      margin={{ left: 30 }}
      infoTooltipMessage={tooltipInfoMessages().backingPerOhm}
      expandedGraphStrokeColor={""}
      isPOL={false}
      isLoading={!data}
      isStaked={false}
      itemDecimals={2}
      subgraphQueryUrl={queryExplorerUrl}
    />
  );
};

export const MarketValueGraph = ({ count = defaultRecordsCount }: GraphProps) => {
  const { data } = useMarketValueMetricsQuery({ endpoint: getSubgraphUrl() }, { records: count });
  const queryExplorerUrl = getSubgraphQueryExplorerUrl(MarketValueMetricsDocument);

  const itemNames = [t`Stablecoins`, t`Volatile Assets`, t`Protocol-Owned Liquidity`];
  const dataKeys = ["treasuryStableValue", "treasuryVolatileValue", "treasuryLPValue"];
  const categoriesMap = getCategoriesMap(itemNames, dataKeys);
  const colorsMap = getColoursMap(defaultBulletpointColours, dataKeys);

  return (
    <Chart
      type="stack"
      data={data ? data.protocolMetrics : []}
      dataKey={dataKeys}
      color={""}
      stopColor={[[]]}
      stroke={defaultColors}
      dataFormat={DataFormat.Currency}
      headerText={t`Market Value of Treasury Assets`}
      headerSubText={`${data && formatCurrency(data.protocolMetrics[0].treasuryMarketValue)}`}
      bulletpointColors={colorsMap}
      categories={categoriesMap}
      itemType={itemType.dollar}
      infoTooltipMessage={tooltipInfoMessages().mvt}
      expandedGraphStrokeColor={""}
      isPOL={false}
      isLoading={!data}
      isStaked={false}
      itemDecimals={0}
      subgraphQueryUrl={queryExplorerUrl}
      displayTooltipTotal={true}
    />
  );
};

export const ProtocolOwnedLiquidityGraph = ({ count = defaultRecordsCount }: GraphProps) => {
  const { data } = useProtocolOwnedLiquidityComponentsQuery({ endpoint: getSubgraphUrl() }, { records: count });
  const queryExplorerUrl = getSubgraphQueryExplorerUrl(ProtocolOwnedLiquidityComponentsDocument);

  // TODO add caching
  const tokenSummary = getKeysTokenSummary(
    data?.protocolMetrics,
    ["treasuryLPValueComponents"],
    ["Protocol-Owned Liquidity"],
  );

  const tokenCategories = getTokensFromKey(tokenSummary, "treasuryLPValueComponents");
  const dataKeys = getDataKeysFromTokens(tokenCategories, "treasuryLPValueComponents");
  const categoriesMap = getCategoriesMap(tokenCategories, dataKeys);
  const colorsMap = getColoursMap(defaultBulletpointColours, dataKeys);

  return (
    <Chart
      type="stack"
      data={tokenSummary}
      dataKey={dataKeys}
      color={""}
      stopColor={[[]]}
      stroke={defaultColors}
      dataFormat={DataFormat.Currency}
      headerText={t`Protocol-Owned Liquidity`}
      headerSubText={`${data && formatCurrency(data.protocolMetrics[0].treasuryLPValueComponents.value, 0)}`}
      bulletpointColors={colorsMap}
      categories={categoriesMap}
      itemType={itemType.dollar}
      infoTooltipMessage={tooltipInfoMessages().pol}
      expandedGraphStrokeColor={""}
      isPOL={false}
      isLoading={!data}
      isStaked={false}
      itemDecimals={0}
      subgraphQueryUrl={queryExplorerUrl}
      displayTooltipTotal={true}
    />
  );
};

export const AssetsTable = () => {
  const keys: readonly string[] = [
    "treasuryStableValueComponents",
    "treasuryVolatileValueComponents",
    "treasuryLPValueComponents",
  ];
  const categories: readonly string[] = ["Stablecoins", "Volatile", "Protocol-Owned Liquidity"];

  const { data } = useMarketValueMetricsComponentsQuery({ endpoint: getSubgraphUrl() });
  const queryExplorerUrl = getSubgraphQueryExplorerUrl(MarketValueMetricsComponentsDocument);

  // State variables used for rendering
  const initialTokenSummary: any[] = [];
  const [tokenSummary, setTokenSummary] = useState(initialTokenSummary);
  const initialReducedTokens: MetricRow[] = [];
  const [reducedTokens, setReducedTokens] = useState(initialReducedTokens);
  const [currentMetric, setCurrentMetric] = useState<MetricRow | null>(null);

  /**
   * We derive reducedTokens and currentMetric from {data}. They only need to be re-calculated
   * when {data} changes, so they get wrapped in `useMemo`.
   */
  useMemo(() => {
    if (!data) {
      setTokenSummary([]);
      setReducedTokens([]);
      setCurrentMetric(null);
      return;
    }

    const newTokenSummary = getKeysTokenSummary(data.protocolMetrics, keys, categories);
    const newReducedTokens = reduceKeysTokenSummary(newTokenSummary, keys);
    const newCurrentMetric = newReducedTokens[0];

    setTokenSummary(newTokenSummary);
    setReducedTokens(newReducedTokens);
    setCurrentMetric(newCurrentMetric);
  }, [data]);

  // TODO handle date scrubbing

  const columns: GridColDef[] = [
    { field: "token", headerName: "Asset", flex: 1 },
    { field: "category", headerName: "Category", flex: 1 },
    {
      field: "value",
      headerName: "Value",
      flex: 1,
      type: "string",
      sortComparator: (v1, v2) => {
        // Get rid of all non-number characters
        const stripCurrency = (currencyString: string) => currencyString.replaceAll(/[$,]/g, "");

        return parseFloat(stripCurrency(v1)) - parseFloat(stripCurrency(v2));
      },
      valueGetter: (params: GridValueGetterParams) => formatCurrency(parseFloat(params.row.value)),
    },
  ];

  const headerText = "Holdings";

  return (
    <ChartCard
      headerText={headerText}
      headerTooltip={t`This table lists the details of the treasury assets that make up the market value`}
      subgraphQueryUrl={queryExplorerUrl}
      isLoading={false}
    >
      <DataGrid
        autoHeight
        loading={!data}
        disableSelectionOnClick
        rows={currentMetric ? currentMetric.tokens : []}
        rowHeight={30}
        columns={columns}
        pageSize={10}
        getRowId={row => row.token}
        // Sort by value descending
        initialState={{
          sorting: {
            sortModel: [{ field: "value", sort: "desc" }],
          },
        }}
        // Only ascending or descending sort
        sortingOrder={["desc", "asc"]}
        sx={{
          "& .MuiDataGrid-columnHeaders": {
            fontSize: "16px",
            height: "40px",
            borderBottom: "0px",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 800,
          },
          "& .MuiDataGrid-cellContent": {
            fontSize: "14px",
          },
          // "& .MuiDataGrid-root" doesn't work here, for some reason
          "&.MuiDataGrid-root": {
            paddingLeft: "12px",
            paddingRight: "12px",
            border: "0px",
          },
          "& .MuiDataGrid-columnSeparator": {
            display: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "0px",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "0px",
          },
          // Disables outline on clicked cells
          "& .MuiDataGrid-cell:focus": {
            outline: "none",
          },
        }}
      />
    </ChartCard>
  );
};