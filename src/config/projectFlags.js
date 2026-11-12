// src/config/projectFlags.js
// Maps the T-ERP projects that can be bought onto the product flags expected by
// Central Master's /api/user-master/ endpoint.

// Every flag the user-master API accepts. Anything not bought stays false.
export const USER_MASTER_FLAGS = [
  "trellisco",
  "claudius",
  "melone",
  "tixelise",
  "trellisco_crm",
  "melone_stay",
  "trellisco_books",
  "fee_flow",
]

// /t-erp/mobileapp/api/projects/ returns an `api_endpoint` per project, which is
// the most reliable key to match on.
export const PROJECT_FLAG_BY_ENDPOINT = {
  trellisco: "trellisco",
  cluadius: "claudius", // the projects API spells Cluadius with a swapped u/a
  melone: "melone",
  melonestay: "melone_stay",
  tixelise: "tixelise",
  feeflow: "fee_flow",
}

// Fallback for payloads that only carry a display name.
export const PROJECT_FLAG_BY_NAME = {
  trellisco: "trellisco",
  cluadius: "claudius",
  melone: "melone",
  "melone stay": "melone_stay",
  tixelise: "tixelise",
  "fee flow": "fee_flow",
}

// Trellisco IMS and VenueKart have no user-master flag yet: their license is
// still created, but no flag is switched on for them.

export function flagsForProjects(selectedProjects = []) {
  const flags = Object.fromEntries(USER_MASTER_FLAGS.map((flag) => [flag, false]))

  selectedProjects.forEach((item) => {
    const endpoint = String(item?.api_endpoint || "").toLowerCase()
    const name = String(item?.project || item?.name || "").toLowerCase()
    const flag = PROJECT_FLAG_BY_ENDPOINT[endpoint] || PROJECT_FLAG_BY_NAME[name]
    if (flag) flags[flag] = true
  })

  return flags
}
