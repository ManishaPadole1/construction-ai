/**
 * Generate mock 3D model data - Professional Office Building
 * 2 Floors with proper rooms, labels, and colors
 */

export function generateMock3DModel() {
  return {
    scenes: [
      // ========== GROUND FLOOR ==========
      {
        floor: 1,
        objects: [
          // RECEPTION - Red
          {
            id: "reception_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [0, 0, 0],
                [15, 0, 0],
                [15, 0, 10],
                [0, 0, 10],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#EF5350",
              opacity: 0.95,
              transparent: true,
              emissive: "#C62828",
              emissiveIntensity: 0.3,
            },
            label: "Reception & Lobby",
            room_id: "reception",
            area: 150.0,
          },
          {
            id: "reception_walls",
            type: "wall",
            geometry: {
              vertices: [
                [15, 0, 0],
                [15, 0, 10],
                [15, 4, 10],
                [15, 4, 0],
                [15, 0, 10],
                [0, 0, 10],
                [0, 4, 10],
                [15, 4, 10],
                [0, 0, 10],
                [0, 0, 0],
                [0, 4, 0],
                [0, 4, 10],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "reception",
          },

          // MEETING ROOM 1 - Blue
          {
            id: "meeting1_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [15, 0, 0],
                [30, 0, 0],
                [30, 0, 8],
                [15, 0, 8],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#42A5F5",
              opacity: 0.95,
              transparent: true,
              emissive: "#1976D2",
              emissiveIntensity: 0.3,
            },
            label: "Meeting Room 1",
            room_id: "meeting1",
            area: 120.0,
          },
          {
            id: "meeting1_walls",
            type: "wall",
            geometry: {
              vertices: [
                [30, 0, 0],
                [30, 0, 8],
                [30, 4, 8],
                [30, 4, 0],
                [30, 0, 8],
                [15, 0, 8],
                [15, 4, 8],
                [30, 4, 8],
                [15, 0, 8],
                [15, 0, 0],
                [15, 4, 0],
                [15, 4, 8],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "meeting1",
          },

          // CORRIDOR - Gray
          {
            id: "corridor1_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [0, 0, 10],
                [30, 0, 10],
                [30, 0, 14],
                [0, 0, 14],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#78909C",
              opacity: 0.95,
              transparent: true,
              emissive: "#546E7A",
              emissiveIntensity: 0.3,
            },
            label: "Main Corridor",
            room_id: "corridor1",
            area: 120.0,
          },
          {
            id: "corridor1_walls",
            type: "wall",
            geometry: {
              vertices: [
                [30, 0, 10],
                [30, 0, 14],
                [30, 4, 14],
                [30, 4, 10],
                [30, 0, 14],
                [0, 0, 14],
                [0, 4, 14],
                [30, 4, 14],
                [0, 0, 14],
                [0, 0, 10],
                [0, 4, 10],
                [0, 4, 14],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "corridor1",
          },

          // OFFICE 1 - Green
          {
            id: "office1_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [0, 0, 14],
                [12, 0, 14],
                [12, 0, 22],
                [0, 0, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#66BB6A",
              opacity: 0.95,
              transparent: true,
              emissive: "#388E3C",
              emissiveIntensity: 0.3,
            },
            label: "Office 1",
            room_id: "office1",
            area: 96.0,
          },
          {
            id: "office1_walls",
            type: "wall",
            geometry: {
              vertices: [
                [12, 0, 14],
                [12, 0, 22],
                [12, 4, 22],
                [12, 4, 14],
                [12, 0, 22],
                [0, 0, 22],
                [0, 4, 22],
                [12, 4, 22],
                [0, 0, 22],
                [0, 0, 14],
                [0, 4, 14],
                [0, 4, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "office1",
          },

          // OFFICE 2 - Orange
          {
            id: "office2_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [12, 0, 14],
                [24, 0, 14],
                [24, 0, 22],
                [12, 0, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#FFA726",
              opacity: 0.95,
              transparent: true,
              emissive: "#F57C00",
              emissiveIntensity: 0.3,
            },
            label: "Office 2",
            room_id: "office2",
            area: 96.0,
          },
          {
            id: "office2_walls",
            type: "wall",
            geometry: {
              vertices: [
                [24, 0, 14],
                [24, 0, 22],
                [24, 4, 22],
                [24, 4, 14],
                [24, 0, 22],
                [12, 0, 22],
                [12, 4, 22],
                [24, 4, 22],
                [12, 0, 22],
                [12, 0, 14],
                [12, 4, 14],
                [12, 4, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "office2",
          },

          // RESTROOM - Purple
          {
            id: "restroom1_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [24, 0, 14],
                [30, 0, 14],
                [30, 0, 22],
                [24, 0, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#AB47BC",
              opacity: 0.95,
              transparent: true,
              emissive: "#7B1FA2",
              emissiveIntensity: 0.3,
            },
            label: "Restroom",
            room_id: "restroom1",
            area: 48.0,
          },
          {
            id: "restroom1_walls",
            type: "wall",
            geometry: {
              vertices: [
                [30, 0, 14],
                [30, 0, 22],
                [30, 4, 22],
                [30, 4, 14],
                [30, 0, 22],
                [24, 0, 22],
                [24, 4, 22],
                [30, 4, 22],
                [24, 0, 22],
                [24, 0, 14],
                [24, 4, 14],
                [24, 4, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "restroom1",
          },
        ],
        // ========== DOORS ==========
        doors: [
          { id: "door1", type: "door", position: [7.5, 0, 0], rotation: [0, 0, 0], width: 2, height: 3, label: "Main Entry" },
          { id: "door2", type: "door", position: [15, 0, 4], rotation: [0, 1.57, 0], width: 1.2, height: 2.2 },
          { id: "door3", type: "door", position: [6, 0, 14], rotation: [0, 0, 0], width: 1.0, height: 2.2 },
          { id: "door4", type: "door", position: [18, 0, 14], rotation: [0, 0, 0], width: 1.0, height: 2.2 },
          { id: "door5", type: "door", position: [27, 0, 14], rotation: [0, 0, 0], width: 0.9, height: 2.2 },
        ],

        // ========== EQUIPMENT ==========
        equipment: [
          { id: "eq1", type: "desk", position: [7.5, 0, 5], rotation: [0, 0, 0], label: "Reception Desk" },
          { id: "eq2", type: "server", position: [25, 4, 20], rotation: [0, 0, 0], label: "Server Rack A" },
          { id: "eq3", type: "table", position: [10, 4, 7], rotation: [0, 0, 0], label: "Conf. Table" },
        ],

        // ========== EXITS ==========
        exits: [
          { id: "exit1", type: "exit", position: [7.5, 2, 0], label: "MAIN EXIT" },
          { id: "exit2", type: "exit", position: [30, 2, 12], label: "FIRE EXIT" },
        ],

        // ========== BOUNDARIES ==========
        boundaries: [
          {
            points: [
              [-1, 0, -1],
              [31, 0, -1],
              [31, 0, 23],
              [-1, 0, 23],
              [-1, 0, -1],
            ],
            color: "#FFC107",
          },
        ],
      },

      // ========== FIRST FLOOR ==========
      {
        floor: 2,
        objects: [
          // CONFERENCE ROOM - Cyan
          {
            id: "conference_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [0, 4, 0],
                [20, 4, 0],
                [20, 4, 14],
                [0, 4, 14],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#26C6DA",
              opacity: 0.95,
              transparent: true,
              emissive: "#00ACC1",
              emissiveIntensity: 0.3,
            },
            label: "Conference Room",
            room_id: "conference",
            area: 280.0,
          },
          {
            id: "conference_walls",
            type: "wall",
            geometry: {
              vertices: [
                [20, 4, 0],
                [20, 4, 14],
                [20, 8, 14],
                [20, 8, 0],
                [20, 4, 14],
                [0, 4, 14],
                [0, 8, 14],
                [20, 8, 14],
                [0, 4, 14],
                [0, 4, 0],
                [0, 8, 0],
                [0, 8, 14],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "conference",
          },

          // EXECUTIVE OFFICE - Gold
          {
            id: "executive_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [20, 4, 0],
                [30, 4, 0],
                [30, 4, 10],
                [20, 4, 10],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#FFD54F",
              opacity: 0.95,
              transparent: true,
              emissive: "#FFA000",
              emissiveIntensity: 0.3,
            },
            label: "Executive Office",
            room_id: "executive",
            area: 100.0,
          },
          {
            id: "executive_walls",
            type: "wall",
            geometry: {
              vertices: [
                [30, 4, 0],
                [30, 4, 10],
                [30, 8, 10],
                [30, 8, 0],
                [30, 4, 10],
                [20, 4, 10],
                [20, 8, 10],
                [30, 8, 10],
                [20, 4, 10],
                [20, 4, 0],
                [20, 8, 0],
                [20, 8, 10],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "executive",
          },

          // BREAK ROOM - Lime
          {
            id: "breakroom_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [20, 4, 10],
                [30, 4, 10],
                [30, 4, 18],
                [20, 4, 18],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#9CCC65",
              opacity: 0.95,
              transparent: true,
              emissive: "#689F38",
              emissiveIntensity: 0.3,
            },
            label: "Break Room",
            room_id: "breakroom",
            area: 80.0,
          },
          {
            id: "breakroom_walls",
            type: "wall",
            geometry: {
              vertices: [
                [30, 4, 10],
                [30, 4, 18],
                [30, 8, 18],
                [30, 8, 10],
                [30, 4, 18],
                [20, 4, 18],
                [20, 8, 18],
                [30, 8, 18],
                [20, 4, 18],
                [20, 4, 10],
                [20, 8, 10],
                [20, 8, 18],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "breakroom",
          },

          // SERVER ROOM - Deep Purple
          {
            id: "server_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [20, 4, 18],
                [30, 4, 18],
                [30, 4, 22],
                [20, 4, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#7E57C2",
              opacity: 0.95,
              transparent: true,
              emissive: "#512DA8",
              emissiveIntensity: 0.3,
            },
            label: "Server Room",
            room_id: "server",
            area: 40.0,
          },
          {
            id: "server_walls",
            type: "wall",
            geometry: {
              vertices: [
                [30, 4, 18],
                [30, 4, 22],
                [30, 8, 22],
                [30, 8, 18],
                [30, 4, 22],
                [20, 4, 22],
                [20, 8, 22],
                [30, 8, 22],
                [20, 4, 22],
                [20, 4, 18],
                [20, 8, 18],
                [20, 8, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "server",
          },

          // OPEN WORKSPACE - Teal
          {
            id: "workspace_floor",
            type: "room",
            subtype: "floor",
            geometry: {
              vertices: [
                [0, 4, 14],
                [20, 4, 14],
                [20, 4, 22],
                [0, 4, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
              ],
              normals: [
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
                [0, 0, 1],
              ],
            },
            material: {
              color: "#26A69A",
              opacity: 0.95,
              transparent: true,
              emissive: "#00897B",
              emissiveIntensity: 0.3,
            },
            label: "Open Workspace",
            room_id: "workspace",
            area: 160.0,
          },
          {
            id: "workspace_walls",
            type: "wall",
            geometry: {
              vertices: [
                [20, 4, 14],
                [20, 4, 22],
                [20, 8, 22],
                [20, 8, 14],
                [20, 4, 22],
                [0, 4, 22],
                [0, 8, 22],
                [20, 8, 22],
                [0, 4, 22],
                [0, 4, 14],
                [0, 8, 14],
                [0, 8, 22],
              ],
              faces: [
                [0, 1, 2],
                [0, 2, 3],
                [4, 5, 6],
                [4, 6, 7],
                [8, 9, 10],
                [8, 10, 11],
              ],
              normals: [],
            },
            material: { color: "#ECEFF1", opacity: 0.15, transparent: true },
            room_id: "workspace",
          },
        ],
      },
    ],
    cameras: {
      isometric_45: {
        position: [50, 25, 40],
        target: [15, 4, 11],
        type: "perspective",
        fov: 50,
      },
      isometric_top: {
        position: [15, 40, 11],
        target: [15, 4, 11],
        type: "orthographic",
        zoom: 0.15,
      },
      front: {
        position: [15, 20, 50],
        target: [15, 4, 11],
        type: "orthographic",
        zoom: 0.15,
      },
      side: {
        position: [60, 20, 11],
        target: [15, 4, 11],
        type: "orthographic",
        zoom: 0.15,
      },
    },
    metadata: {
      building_height: 8.0,
      floor_count: 2,
      total_area: 1100.0,
      scale: 1.0,
      unit: "m",
    },
  };
}

/**
 * Inject mock 3D model data into API response for testing
 */
export function injectMock3DModel(apiResponse) {
  if (!apiResponse?.engine_result?.ui_view) {
    return apiResponse;
  }

  if (!apiResponse.engine_result.ui_view["model_3d"]) {
    apiResponse.engine_result.ui_view["model_3d"] = generateMock3DModel();
  }

  return apiResponse;
}
