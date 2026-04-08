export type Region = {
	code: string;
	name: string;
	aliases?: readonly string[];
};

export function normalizeRegionLookupToken(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replaceAll(".", "")
		.replaceAll("&", " and ")
		.replace(/\s+/g, " ");
}

export function createRegionLookup<T extends Region>(regions: readonly T[]) {
	const byCode = new Map<string, T>();
	const byToken = new Map<string, T>();

	for (const region of regions) {
		byCode.set(region.code.toUpperCase(), region);
		byToken.set(normalizeRegionLookupToken(region.code), region);
		byToken.set(normalizeRegionLookupToken(region.name), region);

		for (const alias of region.aliases ?? []) {
			byToken.set(normalizeRegionLookupToken(alias), region);
		}
	}

	return {
		byCode,
		byToken,
	};
}

export const US_STATES_ONLY = [
	{ code: "AL", name: "Alabama" },
	{ code: "AK", name: "Alaska" },
	{ code: "AZ", name: "Arizona" },
	{ code: "AR", name: "Arkansas" },
	{ code: "CA", name: "California" },
	{ code: "CO", name: "Colorado" },
	{ code: "CT", name: "Connecticut" },
	{ code: "DE", name: "Delaware" },
	{ code: "FL", name: "Florida" },
	{ code: "GA", name: "Georgia" },
	{ code: "HI", name: "Hawaii" },
	{ code: "ID", name: "Idaho" },
	{ code: "IL", name: "Illinois" },
	{ code: "IN", name: "Indiana" },
	{ code: "IA", name: "Iowa" },
	{ code: "KS", name: "Kansas" },
	{ code: "KY", name: "Kentucky" },
	{ code: "LA", name: "Louisiana" },
	{ code: "ME", name: "Maine" },
	{ code: "MD", name: "Maryland" },
	{ code: "MA", name: "Massachusetts" },
	{ code: "MI", name: "Michigan" },
	{ code: "MN", name: "Minnesota" },
	{ code: "MS", name: "Mississippi" },
	{ code: "MO", name: "Missouri" },
	{ code: "MT", name: "Montana" },
	{ code: "NE", name: "Nebraska" },
	{ code: "NV", name: "Nevada" },
	{ code: "NH", name: "New Hampshire" },
	{ code: "NJ", name: "New Jersey" },
	{ code: "NM", name: "New Mexico" },
	{ code: "NY", name: "New York" },
	{ code: "NC", name: "North Carolina" },
	{ code: "ND", name: "North Dakota" },
	{ code: "OH", name: "Ohio" },
	{ code: "OK", name: "Oklahoma" },
	{ code: "OR", name: "Oregon" },
	{ code: "PA", name: "Pennsylvania" },
	{ code: "RI", name: "Rhode Island" },
	{ code: "SC", name: "South Carolina" },
	{ code: "SD", name: "South Dakota" },
	{ code: "TN", name: "Tennessee" },
	{ code: "TX", name: "Texas" },
	{ code: "UT", name: "Utah" },
	{ code: "VT", name: "Vermont" },
	{ code: "VA", name: "Virginia" },
	{ code: "WA", name: "Washington" },
	{ code: "WV", name: "West Virginia" },
	{ code: "WI", name: "Wisconsin" },
	{ code: "WY", name: "Wyoming" },
] as const satisfies readonly Region[];

export const US_TERRITORIES = [
	{ code: "AS", name: "American Samoa" },
	{ code: "GU", name: "Guam" },
	{
		code: "MP",
		name: "Northern Mariana Islands",
		aliases: ["CNMI", "Commonwealth of the Northern Mariana Islands"],
	},
	{ code: "PR", name: "Puerto Rico" },
	{
		code: "VI",
		name: "U.S. Virgin Islands",
		aliases: ["US Virgin Islands", "Virgin Islands"],
	},
] as const satisfies readonly Region[];

export const US_REGIONS = [
	...US_STATES_ONLY,
	...US_TERRITORIES,
] as const satisfies readonly Region[];

export const CANADA_PROVINCES_AND_TERRITORIES = [
	{ code: "AB", name: "Alberta" },
	{ code: "BC", name: "British Columbia" },
	{ code: "MB", name: "Manitoba" },
	{ code: "NB", name: "New Brunswick" },
	{
		code: "NL",
		name: "Newfoundland and Labrador",
		aliases: ["Newfoundland"],
	},
	{ code: "NS", name: "Nova Scotia" },
	{
		code: "NT",
		name: "Northwest Territories",
		aliases: ["NWT"],
	},
	{ code: "NU", name: "Nunavut" },
	{ code: "ON", name: "Ontario" },
	{
		code: "PE",
		name: "Prince Edward Island",
		aliases: ["PEI"],
	},
	{ code: "QC", name: "Quebec" },
	{ code: "SK", name: "Saskatchewan" },
	{ code: "YT", name: "Yukon" },
] as const satisfies readonly Region[];

export const ENGLAND_CEREMONIAL_COUNTIES = [
	{ code: "BEDFORDSHIRE", name: "Bedfordshire" },
	{ code: "BERKSHIRE", name: "Berkshire" },
	{ code: "BRISTOL", name: "Bristol" },
	{ code: "BUCKINGHAMSHIRE", name: "Buckinghamshire" },
	{ code: "CAMBRIDGESHIRE", name: "Cambridgeshire" },
	{ code: "CHESHIRE", name: "Cheshire" },
	{ code: "CITY_OF_LONDON", name: "City of London" },
	{ code: "CORNWALL", name: "Cornwall" },
	{ code: "CUMBRIA", name: "Cumbria" },
	{ code: "DERBYSHIRE", name: "Derbyshire" },
	{ code: "DEVON", name: "Devon" },
	{ code: "DORSET", name: "Dorset" },
	{
		code: "DURHAM",
		name: "Durham",
		aliases: ["County Durham"],
	},
	{
		code: "EAST_RIDING_OF_YORKSHIRE",
		name: "East Riding of Yorkshire",
		aliases: ["East Riding"],
	},
	{ code: "EAST_SUSSEX", name: "East Sussex" },
	{ code: "ESSEX", name: "Essex" },
	{ code: "GLOUCESTERSHIRE", name: "Gloucestershire" },
	{ code: "GREATER_LONDON", name: "Greater London" },
	{ code: "GREATER_MANCHESTER", name: "Greater Manchester" },
	{ code: "HAMPSHIRE", name: "Hampshire" },
	{ code: "HEREFORDSHIRE", name: "Herefordshire" },
	{ code: "HERTFORDSHIRE", name: "Hertfordshire" },
	{ code: "ISLE_OF_WIGHT", name: "Isle of Wight" },
	{ code: "KENT", name: "Kent" },
	{ code: "LANCASHIRE", name: "Lancashire" },
	{ code: "LEICESTERSHIRE", name: "Leicestershire" },
	{ code: "LINCOLNSHIRE", name: "Lincolnshire" },
	{ code: "MERSEYSIDE", name: "Merseyside" },
	{ code: "NORFOLK", name: "Norfolk" },
	{ code: "NORTH_YORKSHIRE", name: "North Yorkshire" },
	{ code: "NORTHAMPTONSHIRE", name: "Northamptonshire" },
	{ code: "NORTHUMBERLAND", name: "Northumberland" },
	{ code: "NOTTINGHAMSHIRE", name: "Nottinghamshire" },
	{ code: "OXFORDSHIRE", name: "Oxfordshire" },
	{ code: "RUTLAND", name: "Rutland" },
	{ code: "SHROPSHIRE", name: "Shropshire" },
	{ code: "SOMERSET", name: "Somerset" },
	{ code: "SOUTH_YORKSHIRE", name: "South Yorkshire" },
	{ code: "STAFFORDSHIRE", name: "Staffordshire" },
	{ code: "SUFFOLK", name: "Suffolk" },
	{ code: "SURREY", name: "Surrey" },
	{
		code: "TYNE_AND_WEAR",
		name: "Tyne and Wear",
		aliases: ["Tyne & Wear"],
	},
	{ code: "WARWICKSHIRE", name: "Warwickshire" },
	{ code: "WEST_MIDLANDS", name: "West Midlands" },
	{ code: "WEST_SUSSEX", name: "West Sussex" },
	{ code: "WEST_YORKSHIRE", name: "West Yorkshire" },
	{ code: "WILTSHIRE", name: "Wiltshire" },
	{ code: "WORCESTERSHIRE", name: "Worcestershire" },
] as const satisfies readonly Region[];
