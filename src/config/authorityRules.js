// Options: 'NEW_BUILDING', 'RENOVATION'

// Fallback rules to be used if an authority is not explicitly defined in the active project type
export const FALLBACK_RULES = {
  1: {
    name: "Upload Drawings",
    description: "Standard drawing submission for Dubai Government",
    drawingInput: [
      {
        key: "default",
        enabled: true,
        heading: "Upload Approved",
        optional: false,
        supportedFormats: ["dxf", "pdf"],
        maxSize: 700,
      },
    ],
    requirementInput: [
      {
        key: "lighting",
        enabled: true,
        heading: "Lighting Layout",
        optional: false,
        supportedFormats: ["pdf", "txt"],
        maxSize: 50,
      },
      {
        key: "power",
        enabled: true,
        heading: "Power Layout",
        optional: false,
        supportedFormats: ["pdf", "txt"],
        maxSize: 50,
      },
      {
        key: "sld",
        enabled: true,
        heading: "Single Line Diagram (SLD)",
        optional: false,
        supportedFormats: ["pdf"],
        maxSize: 50,
      },
      {
        key: "lighting_and_power",
        enabled: true,
        heading: "Lighting & Power Specs",
        optional: true, // Making this optional as example/fallback logic usually allows flexibility
        supportedFormats: ["pdf"],
        maxSize: 50,
      },
    ],
  },
  2: {
    name: "Detailed Analysis for checking git working",
    description: "In-depth AI analysis of drawings",
    drawingInput: [
      {
        key: "default",
        enabled: true,
        heading: "Upload Approved",
        optional: false,
        supportedFormats: ["dxf"],
        maxSize: 700,
      },
    ],
    requirementInput: [
      {
        key: "default",
        enabled: true,
        heading: "Upload Proposed",
        optional: false,
        supportedFormats: ["pdf"],
        maxSize: 50,
      },
    ],
  },
  3: {
    name: "Quick Check",
    description: "Fast validation of requirements",
    drawingInput: [], // Empty array = disabled
    requirementInput: [
      {
        key: "default",
        enabled: true,
        heading: "Upload Proposed",
        optional: false,
        supportedFormats: ["txt", "pdf"],
        maxSize: 50,
      },
    ],
  },
};

// Master Configuration for all Project Types and Authorities
export const AUTHORITY_CONFIG = {
  NEW_BUILDING: {
    DM: {
      modes: {
        1: {
          name: "Planning Approval",
          description: "Proposed Concept Drawings",
          drawingInput: [],
          requirementInput: [
            { key: "site_plan", heading: "Upload Proposed Site Plan", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "floor_plan", heading: "Upload Proposed Floor Plans", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "elevation", heading: "Upload Proposed Elevations", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "section", heading: "Upload Proposed Sections", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "area_statement", heading: "Upload Area Statement", optional: true, supportedFormats: ["pdf", "xlsx", "xls"], maxSize: 500 },
          ],
        },
        2: {
          name: "Renovation / Modification",
          description: "Existing + Proposed Architectural Drawings",
          drawingInput: [
            {
              key: "existing_floor",
              heading: "Upload Existing Approved Floor Plans",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            { key: "existing_elevation", heading: "Upload Existing Elevations", optional: true, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "existing_site", heading: "Upload Existing Site Plan", optional: true, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
          ],
          requirementInput: [
            { key: "proposed_floor", heading: "Upload Proposed Floor Plans", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "proposed_elevation", heading: "Upload Proposed Elevations", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "proposed_site", heading: "Upload Proposed Site Plan", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
          ],
        },
      },
    },
    DEWA: {
      modes: {
        1: {
          name: "Initial Screening",
          description: "Basic compliance check for new connections",
          drawingInput: [
            {
              key: "elec_diagram",
              enabled: true,
              heading: "Upload Electrical Diagram",
              optional: false,
              supportedFormats: ["dxf", "pdf"],
              maxSize: 700,
            },
          ],
          requirementInput: [
            {
              key: "load_schedule",
              enabled: true,
              heading: "Upload Load Schedule",
              optional: true,
              supportedFormats: ["pdf", "xlsx"],
              maxSize: 50,
            },
          ],
        },
        2: {
          name: "Full AI Analysis",
          description: "Comprehensive check against all DEWA regulations",
          drawingInput: [
            {
              key: "master_plan",
              enabled: true,
              heading: "Upload Master Plan",
              optional: false,
              supportedFormats: ["dxf"],
              maxSize: 700,
            },
          ],
          requirementInput: [
            {
              key: "noc_doc",
              enabled: true,
              heading: "Upload NOC Document",
              optional: false,
              supportedFormats: ["pdf"],
              maxSize: 20,
            },
          ],
        },
      },
    },
    DCD: {
      modes: {
        1: {
          name: "New Building Fire Approval",
          description: "Proposed Fire & Life Safety Drawings",
          drawingInput: [],
          requirementInput: [
            {
              key: "fire_fighting",
              heading: "Upload Proposed Fire Fighting Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            { key: "fire_alarm", heading: "Upload Proposed Fire Alarm Layout", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "escape_plan", heading: "Upload Proposed Escape Plan", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "pump_room", heading: "Upload Pump Room Layout", optional: true, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "hydraulic_calc", heading: "Upload Hydraulic Calculation", optional: true, supportedFormats: ["pdf"], maxSize: 500 },
          ],
        },
      },
    },
    RTA: {
      modes: {
        1: {
          name: "New Building Access & Parking",
          description: "Proposed Traffic & Parking Layouts",
          drawingInput: [],
          requirementInput: [
            { key: "access_plan", heading: "Upload Proposed Site Access Plan", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "parking_layout", heading: "Upload Proposed Parking Layout", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "traffic_study", heading: "Upload Traffic Impact Study", optional: true, supportedFormats: ["pdf"], maxSize: 500 },
          ],
        },
      },
    },
    DDA: {
      modes: {
        1: {
          name: "New Building / Planning Approval",
          description: "Proposed Architectural Concept Drawings",
          drawingInput: [],
          requirementInput: [
            { key: "site_plan", heading: "Upload Proposed Site Plan", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "floor_plan", heading: "Upload Proposed Floor Plans", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "elevation", heading: "Upload Proposed Elevations", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "section", heading: "Upload Proposed Sections", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
          ],
        },
      },
    },
    DLD: {
      modes: {
        1: {
          name: "Plot Modification / Subdivision",
          description: "Proposed Land Layout Documents",
          drawingInput: [],
          requirementInput: [
            { key: "plot_layout", heading: "Upload Proposed Plot Layout", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "survey_plan", heading: "Upload Survey Plan", optional: false, supportedFormats: ["pdf"], maxSize: 500 },
          ],
        },
      },
    },
    DHA: {
      modes: {
        1: {
          name: "New Healthcare Facility",
          description: "Proposed Healthcare Layout",
          drawingInput: [],
          requirementInput: [
            { key: "floor_plan", heading: "Upload Proposed Floor Plan", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "room_schedule", heading: "Upload Room Function Schedule", optional: true, supportedFormats: ["pdf", "xlsx"], maxSize: 500 },
          ],
        },
      },
    },
    TRAKHEES: {
      modes: {
        1: {
          name: "New Building Approval",
          description: "Proposed Architectural & Site Drawings",
          drawingInput: [],
          requirementInput: [
            { key: "site_plan", heading: "Upload Proposed Site Plan", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "floor_plan", heading: "Upload Proposed Floor Plans", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
            { key: "elevation", heading: "Upload Proposed Elevations", optional: false, supportedFormats: ["pdf", "dxf"], maxSize: 700 },
          ],
        },
      },
    },
  },
  RENOVATION: {
    DM: {
      modes: {
        1: {
          name: "As-Built Only",
          description: "As-Built/Approved Drwg. + Requirements",
          drawingInput: [
            {
              key: "default",
              enabled: true,
              heading: "Upload As-Built/Approved Drawing",
              optional: false,
              supportedFormats: ["dxf", "pdf"],
              maxSize: 700,
            },
          ],
          requirementInput: [
            {
              key: "default",
              enabled: true,
              heading: "Upload Requirements",
              optional: false,
              supportedFormats: ["pdf", "txt"],
              maxSize: 50,
            },
          ],
        },
        2: {
          name: "Full Analysis",
          description: "As-Built/Approved Drwg. + Proposed Drwg.",
          drawingInput: [
            {
              key: "default",
              enabled: true,
              heading: "Upload As-Built/Approved Drawing",
              optional: false,
              supportedFormats: ["dxf", "pdf"],
              maxSize: 700,
            },
          ],
          requirementInput: [
            {
              key: "default",
              enabled: true,
              heading: "Upload Proposed Drawing",
              optional: false,
              supportedFormats: ["dxf", "pdf"],
              maxSize: 700,
            },
          ],
        },
        3: {
          name: "Proposed Only",
          description: "Proposed Drwg.",
          drawingInput: [],
          requirementInput: [
            {
              key: "default",
              enabled: true,
              heading: "Upload Proposed Drawing",
              optional: false,
              supportedFormats: ["dxf", "pdf"],
              maxSize: 700,
            },
          ],
        },
      },
    },
    DEWA: {
      modes: {
        1: {
          name: "Power And Electrical Check",
          description: "Approved Load Schedule + Proposed Drawings",
          drawingInput: [
            {
              key: "default",
              enabled: true,
              heading: "Upload Load Schedule Sheet",
              optional: false,
              supportedFormats: ["xlsx", "xls", "pdf"],
              maxSize: 500,
            },
          ],
          requirementInput: [
            {
              key: "lighting_layout",
              enabled: true,
              heading: "Upload Proposed Lighting Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "power_layout",
              enabled: true,
              heading: "Upload Proposed Power Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "sld_layout",
              enabled: true,
              heading: "Upload Proposed SLD Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "load_schedule",
              enabled: true,
              heading: "Upload Proposed Load Schedule",
              optional: true,
              supportedFormats: ["xlsx", "xls", "pdf"],
              maxSize: 500,
            },
          ],
        },
        2: {
          name: "Water Supply Check",
          description: "Approved Load Schedule + Proposed Drawings",
          drawingInput: [
            {
              key: "pump_calculation",
              enabled: true,
              heading: "Upload Pump Calculation",
              optional: true,
              supportedFormats: ["pdf"],
              maxSize: 500,
            },
            {
              key: "tank_calculation",
              enabled: true,
              heading: "Upload Tank Calculation",
              optional: true,
              supportedFormats: ["pdf"],
              maxSize: 500,
            },
          ],
          requirementInput: [
            {
              key: "lighting_layout",
              enabled: true,
              heading: "Upload Proposed Water Supply Drawing",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "tank_and_pump_layout",
              enabled: true,
              heading: "Upload Tank And Pump Schedule",
              optional: true,
              supportedFormats: ["xlsx", "xls", "pdf"],
              maxSize: 500,
            },
            {
              key: "sld_layout",
              enabled: true,
              heading: "Upload Water Demand Calculation",
              optional: true,
              supportedFormats: ["xlsx", "xls", "pdf"],
              maxSize: 700,
            },
          ],
        },
      },
    },
    DCD: {
      modes: {
        1: {
          name: "Fire System Modification",
          description: "Existing + Proposed Fire Layouts",
          drawingInput: [
            {
              key: "existing_fire_fighting",
              heading: "Existing Fire Fighting Layout",
              optional: true,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "existing_fire_alarm",
              heading: "Existing Fire Alarm Layout",
              optional: true,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "existing_emergency_exit_layout",
              heading: "Existing Emergency Exit Layout",
              optional: true,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
          requirementInput: [
            {
              key: "proposed_fire_fighting",
              heading: "Proposed Fire Fighting Layout",
              optional: true,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "proposed_fire_alarm",
              heading: "Proposed Fire Alarm Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "proposed_emergency_exit_layout",
              heading: "Updated Emergency Exit Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
        },
      },
    },
    RTA: {
      modes: {
        1: {
          name: "Access/Parking Modification",
          description: "Existing + Proposed Access/Parking Layouts",
          drawingInput: [
            {
              key: "existing_access",
              heading: "Upload Existing Access/Parking Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
          requirementInput: [
            {
              key: "proposed_access",
              heading: "Upload Proposed Access/Parking Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
        },
      },
    },
    DDA: {
      modes: {
        1: {
          name: "Renovation / Fit-Out",
          description: "Existing + Proposed Architectural Drawings",
          drawingInput: [
            {
              key: "existing_plan",
              heading: "Upload Existing Approved Plan",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
          requirementInput: [
            {
              key: "proposed_plan",
              heading: "Upload Proposed Layout Plan",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "proposed_elevation",
              heading: "Upload Proposed Elevation (if façade change)",
              optional: true,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
        },
      },
    },
    DLD: {
      modes: {
        1: {
          name: "Plot Modification / Subdivision",
          description: "Proposed Land Layout Documents",
          drawingInput: [],
          requirementInput: [
            {
              key: "plot_layout",
              heading: "Upload Proposed Plot Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
            {
              key: "survey_plan",
              heading: "Upload Survey Plan",
              optional: false,
              supportedFormats: ["pdf"],
              maxSize: 500,
            },
          ],
        },
      },
    },
    DHA: {
      modes: {
        1: {
          name: "Clinic Renovation",
          description: "Existing + Proposed Layout",
          drawingInput: [
            {
              key: "existing_plan",
              heading: "Upload Existing Approved Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
          requirementInput: [
            {
              key: "proposed_plan",
              heading: "Upload Proposed Renovation Layout",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
        },
      },
    },
    TRAKHEES: {
      modes: {
        1: {
          name: "Renovation / Modification",
          description: "Existing + Proposed Drawings",
          drawingInput: [
            {
              key: "existing_plan",
              heading: "Upload Existing Approved Drawings",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
          requirementInput: [
            {
              key: "proposed_plan",
              heading: "Upload Proposed Modification Drawings",
              optional: false,
              supportedFormats: ["pdf", "dxf"],
              maxSize: 700,
            },
          ],
        },
      },
    },
  },
};

/**
 * Helper to get rules for a specific authority based on the active project type.
 * Returns the specific rules or the fallback rules if not found.
 */
export const getAuthorityRules = (authorityName, projectType = "RENOVATION") => {
  const projectRules = AUTHORITY_CONFIG[projectType];

  if (projectRules && projectRules[authorityName]) {
    return projectRules[authorityName].modes;
  }

  // Return fallback rules if authority or project type not defined
  return FALLBACK_RULES;
};
