import {
	Anchor,
	Badge,
	Button,
	Group,
	NativeSelect,
	Paper,
	ScrollArea,
	Stack,
	Table,
	Text,
	TextInput,
	Title,
	UnstyledButton,
} from "@mantine/core";
import {
	type Column,
	type ColumnDef,
	type FilterFn,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { CompetitionSummary, RegionCoverage } from "#/lib/wca-types";

type CompetitionStatus = "visited" | "remaining";

export type CompetitionStatusRow = {
	regionCode: string;
	regionName: string;
	status: CompetitionStatus;
	recentCompetition: CompetitionSummary | null;
	upcomingCompetition: CompetitionSummary | null;
	recentCompetitionsCount: number;
	upcomingCompetitionsCount: number;
	searchText: string;
};

type CompetitionTablesProps = {
	scopeLabel: string;
	visitedRegions: RegionCoverage[];
	unvisitedRegions: RegionCoverage[];
};

function formatDateRange(startDate: string, endDate: string) {
	const start = new Date(`${startDate}T00:00:00Z`);
	const end = new Date(`${endDate}T00:00:00Z`);
	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	});

	if (startDate === endDate) {
		return formatter.format(start);
	}

	return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function buildSearchText(coverage: RegionCoverage, status: CompetitionStatus) {
	return [
		coverage.regionCode,
		coverage.regionName,
		status,
		...coverage.recentCompetitions.flatMap((competition) => [
			competition.name,
			competition.city,
		]),
		...coverage.upcomingCompetitions.flatMap((competition) => [
			competition.name,
			competition.city,
		]),
	]
		.join(" ")
		.toLowerCase();
}

export function buildCompetitionStatusRows(
	visitedRegions: RegionCoverage[],
	unvisitedRegions: RegionCoverage[],
): CompetitionStatusRow[] {
	const toRow = (
		coverage: RegionCoverage,
		status: CompetitionStatus,
	): CompetitionStatusRow => ({
		regionCode: coverage.regionCode,
		regionName: coverage.regionName,
		status,
		recentCompetition: coverage.recentCompetitions[0] ?? null,
		upcomingCompetition: coverage.upcomingCompetitions[0] ?? null,
		recentCompetitionsCount: coverage.recentCompetitions.length,
		upcomingCompetitionsCount: coverage.upcomingCompetitions.length,
		searchText: buildSearchText(coverage, status),
	});

	return [
		...visitedRegions.map((coverage) => toRow(coverage, "visited")),
		...unvisitedRegions.map((coverage) => toRow(coverage, "remaining")),
	];
}

export function filterCompetitionStatusRows(
	rows: CompetitionStatusRow[],
	query: string,
) {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return rows;
	}

	return rows.filter((row) => row.searchText.includes(normalizedQuery));
}

function CompetitionSummaryCell({
	competition,
	emptyLabel,
}: {
	competition: CompetitionSummary | null;
	emptyLabel: string;
}) {
	if (!competition) {
		return (
			<Text size="sm" c="dimmed">
				{emptyLabel}
			</Text>
		);
	}

	return (
		<Stack gap={2}>
			<Anchor
				href={competition.wcaUrl}
				target="_blank"
				rel="noreferrer"
				fw={700}
			>
				{competition.name}
			</Anchor>
			<Text size="sm" c="dimmed">
				{competition.city}
			</Text>
			<Text size="sm" c="dimmed">
				{formatDateRange(competition.startDate, competition.endDate)}
			</Text>
		</Stack>
	);
}

function SortableHeader<TData>({
	column,
	label,
}: {
	column: Column<TData, unknown>;
	label: string;
}) {
	const sorted = column.getIsSorted();
	const Icon =
		sorted === "asc"
			? ArrowUp
			: sorted === "desc"
				? ArrowDown
				: ArrowUpDown;

	return (
		<UnstyledButton
			onClick={column.getToggleSortingHandler()}
			w="100%"
			style={{ display: "block" }}
		>
			<Group justify="space-between" wrap="nowrap" gap="xs">
				<Text fw={700} size="sm">
					{label}
				</Text>
				<Icon size={14} strokeWidth={1.8} />
			</Group>
		</UnstyledButton>
	);
}

const columns: ColumnDef<CompetitionStatusRow>[] = [
	{
		accessorKey: "regionName",
		id: "region",
		header: ({ column }) => (
			<SortableHeader column={column} label="Region" />
		),
		cell: ({ row }) => (
			<Stack gap={2}>
				<Text fw={700}>{row.original.regionName}</Text>
				<Text size="sm" c="dimmed">
					{row.original.regionCode}
				</Text>
			</Stack>
		),
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<SortableHeader column={column} label="Status" />
		),
		sortingFn: (rowA, rowB) => {
			const order: Record<CompetitionStatus, number> = {
				remaining: 0,
				visited: 1,
			};

			return order[rowA.original.status] - order[rowB.original.status];
		},
		cell: ({ row }) => (
			<Badge
				variant={row.original.status === "visited" ? "filled" : "light"}
				color={row.original.status === "visited" ? "teal" : "gray"}
			>
				{row.original.status === "visited" ? "Visited" : "Remaining"}
			</Badge>
		),
	},
	{
		accessorFn: (row) => row.recentCompetition?.startDate ?? "",
		id: "latestCompleted",
		header: ({ column }) => (
			<SortableHeader column={column} label="Latest completed" />
		),
		cell: ({ row }) => (
			<CompetitionSummaryCell
				competition={row.original.recentCompetition}
				emptyLabel="No completed competitions in the current catalog."
			/>
		),
	},
	{
		accessorFn: (row) => row.upcomingCompetition?.startDate ?? "9999-12-31",
		id: "nextOpportunity",
		header: ({ column }) => (
			<SortableHeader column={column} label="Next opportunity" />
		),
		cell: ({ row }) => (
			<CompetitionSummaryCell
				competition={row.original.upcomingCompetition}
				emptyLabel="No upcoming competitions are currently listed."
			/>
		),
	},
	{
		accessorFn: (row) =>
			row.recentCompetitionsCount + row.upcomingCompetitionsCount,
		id: "catalogSnapshot",
		header: ({ column }) => (
			<SortableHeader column={column} label="Catalog snapshot" />
		),
		cell: ({ row }) => (
			<Stack gap={2}>
				<Text fw={600}>
					{row.original.recentCompetitionsCount} recent
				</Text>
				<Text size="sm" c="dimmed">
					{row.original.upcomingCompetitionsCount} upcoming
				</Text>
			</Stack>
		),
	},
];

const noopFilter: FilterFn<CompetitionStatusRow> = () => true;

export function CompetitionTables({
	scopeLabel,
	visitedRegions,
	unvisitedRegions,
}: CompetitionTablesProps) {
	const [search, setSearch] = useState("");
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "status", desc: false },
		{ id: "region", desc: false },
	]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const allRows = buildCompetitionStatusRows(
		visitedRegions,
		unvisitedRegions,
	);
	const filteredRows = filterCompetitionStatusRows(allRows, search);

	useEffect(() => {
		const pageCount = Math.max(
			1,
			Math.ceil(filteredRows.length / pagination.pageSize),
		);

		if (pagination.pageIndex < pageCount) {
			return;
		}

		setPagination((current) => ({
			...current,
			pageIndex: pageCount - 1,
		}));
	}, [filteredRows.length, pagination.pageIndex, pagination.pageSize]);

	const table = useReactTable({
		data: filteredRows,
		columns,
		filterFns: { fuzzy: noopFilter },
		state: {
			sorting,
			pagination,
		},
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const pageCount = table.getPageCount();
	const hasRows = filteredRows.length > 0;

	return (
		<section className="state-section">
			<Paper className="island-shell" p="xl">
				<Stack gap="lg">
					<Group justify="space-between" align="end" gap="md">
						<Stack gap={4} maw={760}>
							<Text
								size="xs"
								tt="uppercase"
								fw={700}
								c="var(--kicker)"
							>
								Competition status
							</Text>
							<Title order={2}>Region-by-region progress</Title>
							<Text size="sm" c="dimmed">
								Each row shows whether this competitor has
								already competed in that region within{" "}
								{scopeLabel}, plus the latest completed event
								and the next listed opportunity.
							</Text>
						</Stack>
						<Text size="sm" c="dimmed">
							{visitedRegions.length} visited /{" "}
							{unvisitedRegions.length} remaining
						</Text>
					</Group>

					<Group align="end" gap="md">
						<TextInput
							label="Search regions or competitions"
							placeholder="Ontario, London, Open..."
							value={search}
							onChange={(event) => {
								setSearch(event.currentTarget.value);
								setPagination((current) => ({
									...current,
									pageIndex: 0,
								}));
							}}
							leftSection={<Search size={16} />}
							flex={1}
						/>
						<NativeSelect
							label="Rows per page"
							data={["10", "25", "50"]}
							value={String(pagination.pageSize)}
							onChange={(event) =>
								setPagination({
									pageIndex: 0,
									pageSize: Number(event.currentTarget.value),
								})
							}
							w={{ base: "100%", sm: 160 }}
						/>
					</Group>

					<ScrollArea offsetScrollbars>
						<Table
							highlightOnHover
							horizontalSpacing="md"
							verticalSpacing="md"
							striped
							miw={980}
						>
							<Table.Thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<Table.Tr key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<Table.Th key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column
																.columnDef
																.header,
															header.getContext(),
														)}
											</Table.Th>
										))}
									</Table.Tr>
								))}
							</Table.Thead>
							<Table.Tbody>
								{hasRows ? (
									table.getRowModel().rows.map((row) => (
										<Table.Tr key={row.id}>
											{row
												.getVisibleCells()
												.map((cell) => (
													<Table.Td
														key={cell.id}
														style={{
															verticalAlign:
																"top",
														}}
													>
														{flexRender(
															cell.column
																.columnDef.cell,
															cell.getContext(),
														)}
													</Table.Td>
												))}
										</Table.Tr>
									))
								) : (
									<Table.Tr>
										<Table.Td
											colSpan={columns.length}
											style={{ textAlign: "center" }}
										>
											<Text size="sm" c="dimmed">
												No regions match "{search}".
											</Text>
										</Table.Td>
									</Table.Tr>
								)}
							</Table.Tbody>
						</Table>
					</ScrollArea>

					<Group justify="space-between" align="center" gap="md">
						<Text size="sm" c="dimmed">
							{filteredRows.length} regions shown
						</Text>
						<Group gap="sm">
							<Button
								variant="default"
								size="xs"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
							>
								Previous
							</Button>
							<Text size="sm" c="dimmed">
								{hasRows
									? `Page ${pagination.pageIndex + 1} of ${pageCount}`
									: "No matching regions"}
							</Text>
							<Button
								variant="default"
								size="xs"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
							>
								Next
							</Button>
						</Group>
					</Group>
				</Stack>
			</Paper>
		</section>
	);
}
