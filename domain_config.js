// Domain-specific configuration for stages and issue categories
const domainConfig = {
  // Physical Design Domain
  'Physical Design': {
    stages: [
      'Synthesis',
      'Design initilization',
      'Floorplan',
      'Placement',
      'CTS',
      'Post CTS opt',
      'Routing',
      'Post route opt',
      'Filler insertion',
      'PD outputs',
      'RC extraction',
      'ECO',
      'STA',
      'EMIR',
      'Physical verification',
      'CLP',
      'LEC'
    ],
    issueCategories: {
      'Synthesis': ['SDC', 'RTL', '.lib', 'Optimization', 'Timing', 'Area', 'Power', 'Clock gating', 'multibit flops', 'Others'],
      'Design initilization': ['Tech LEF', 'LEF', 'NDM', 'ITF', 'TLUPLUS', 'QRC tech', 'Netlist', 'SDC', 'MMMC', 'others'],
      'Floorplan': ['Macro placement', 'power planning', 'endcap', 'tap cells', 'Placement blockages', 'Marco halo (keepout)', 'others'],
      'Placement': ['SDC', 'Bounds', 'Port buffers', 'Setup timing', 'DRVs', 'Cell denisty', 'Pin density', 'congestion', 'Optimization', 'Scan reordering', 'others'],
      'CTS': ['Clock skew', 'Clock latency', 'Clock tree exceptions', 'Clock cells', 'clock NDR', 'Clock routing', 'Congestion', 'cell density', 'CCD', 'CCOPT', 'Setup timing', 'Clock path DRVs', 'Clock gating setup'],
      'Post CTS opt': ['Hold cells', 'hold timing', 'setup timing', 'Congestion', 'cell density', 'DRVs', 'Clock path DRVs', 'Clock NDR', 'Clock routing', 'Clock gating setup', 'Clock gating hold'],
      'Routing': ['Antenna', 'Crosstalk', 'Detour', 'Open', 'short', 'DRCs', 'Setup timing', 'Hold Timing', 'DRVs', 'Clock DRVs', 'Clock DRCs', 'Preroute to postroute correlation'],
      'Post route opt': ['Antenna', 'Crosstalk', 'Detour', 'Open', 'short', 'DRCs', 'Setup timing', 'Hold Timing', 'DRVs', 'Clock DRVs', 'Clock DRCs', 'Preroute to postroute correlation'],
      'Filler insertion': ['Filler gaps', 'Decap density', 'flow issue', 'cell padding'],
      'PD outputs': ['DEF', 'LEF', 'Netlist', 'Physical Netlist', 'GDS'],
      'RC extraction': ['SPEF', 'Flow', 'Inputs', 'Shorts', 'Opens'],
      'ECO': ['Setup timing fixes', 'Hold timing fixes', 'ECO implementation', 'ECO flow', 'DRV fixes', 'Crosstalk delay fixes', 'Crosstalk noise fixes'],
      'STA': ['SDC', 'Flow', 'DMSA', 'Annotation', 'Setup timing', 'Hold timing', 'DRVs', 'Crosstalk Delay', 'Crosstalk noise', 'Clock DRVs', 'Clock gating Violations', 'ECO generation', 'Physical aware eco'],
      'EMIR': ['Static IR drop analysis', 'Dynamic vectorless analysis', 'Dynamic vectored analysis', 'Power EM', 'Signal EM', 'IR fix', 'IR hotspots', 'EM fix', 'Ploc file', 'Inputs', 'VCD', 'Others'],
      'Physical verification': ['DRC', 'LVS', 'Antenna', 'ERC', 'PERC', 'Bump', 'ESD'],
      'CLP': ['Isolation cell', 'Level shifter', 'Power switch', 'UPF'],
      'LEC': ['Settings', 'Debug Analysis']
    }
  },
  
  // Specification Domain
  'Specification': {
    stages: [
      'Requirements Analysis',
      'Functional Specification',
      'Performance Specification',
      'Interface Specification',
      'Design Constraints',
      'Verification Plan'
    ],
    issueCategories: {
      'Requirements Analysis': ['Ambiguous Requirements', 'Missing Requirements', 'Conflicting Requirements', 'Incomplete Requirements', 'Others'],
      'Functional Specification': ['Functional Gaps', 'Interface Issues', 'Protocol Issues', 'Others'],
      'Performance Specification': ['Performance Targets', 'Power Budget', 'Area Budget', 'Timing Constraints', 'Others'],
      'Interface Specification': ['Interface Definition', 'Protocol Specification', 'Signal Integrity', 'Others'],
      'Design Constraints': ['Timing Constraints', 'Power Constraints', 'Area Constraints', 'Others'],
      'Verification Plan': ['Coverage Plan', 'Test Strategy', 'Others']
    }
  },
  
  // Architecture Domain
  'Architecture': {
    stages: [
      'System Architecture',
      'Block Level Design',
      'Interface Design',
      'Power Architecture',
      'Clock Architecture',
      'Memory Architecture'
    ],
    issueCategories: {
      'System Architecture': ['Architecture Gaps', 'Performance Issues', 'Scalability Issues', 'Others'],
      'Block Level Design': ['Block Interface', 'Block Functionality', 'Block Integration', 'Others'],
      'Interface Design': ['Interface Protocol', 'Interface Timing', 'Interface Power', 'Others'],
      'Power Architecture': ['Power Distribution', 'Power Management', 'Power Efficiency', 'Others'],
      'Clock Architecture': ['Clock Distribution', 'Clock Domain', 'Clock Synchronization', 'Others'],
      'Memory Architecture': ['Memory Hierarchy', 'Memory Interface', 'Memory Performance', 'Others']
    }
  },
  
  // Design Domain
  'Design': {
    stages: [
      'RTL Design',
      'RTL Verification',
      'Synthesis',
      'Timing Analysis',
      'Power Analysis',
      'Area Analysis'
    ],
    issueCategories: {
      'RTL Design': ['RTL Coding', 'RTL Optimization', 'RTL Integration', 'Others'],
      'RTL Verification': ['Functional Verification', 'Code Coverage', 'Others'],
      'Synthesis': ['Synthesis Issues', 'Timing Issues', 'Area Issues', 'Power Issues', 'Others'],
      'Timing Analysis': ['Setup Timing', 'Hold Timing', 'Clock Issues', 'Others'],
      'Power Analysis': ['Power Consumption', 'Power Distribution', 'Power Management', 'Others'],
      'Area Analysis': ['Area Utilization', 'Area Optimization', 'Others']
    }
  },
  
  // Design Verification Domain
  'Design Verification': {
    stages: [
      'Test Plan',
      'Testbench Development',
      'Functional Verification',
      'Coverage Analysis',
      'Formal Verification',
      'Emulation'
    ],
    issueCategories: {
      'Test Plan': ['Test Strategy', 'Coverage Plan', 'Test Environment', 'Others'],
      'Testbench Development': ['Testbench Architecture', 'Testbench Components', 'Testbench Integration', 'Others'],
      'Functional Verification': ['Functional Coverage', 'Bug Detection', 'Test Execution', 'Others'],
      'Coverage Analysis': ['Code Coverage', 'Functional Coverage', 'Coverage Closure', 'Others'],
      'Formal Verification': ['Property Verification', 'Equivalence Checking', 'Others'],
      'Emulation': ['Emulation Setup', 'Emulation Execution', 'Emulation Debug', 'Others']
    }
  },
  
  // DFT Domain
  'DFT': {
    stages: [
      'Scan Design',
      'BIST Design',
      'Boundary Scan',
      'Memory BIST',
      'Test Pattern Generation',
      'Test Application'
    ],
    issueCategories: {
      'Scan Design': ['Scan Chain', 'Scan Compression', 'Scan Timing', 'Others'],
      'BIST Design': ['BIST Architecture', 'BIST Controller', 'BIST Pattern', 'Others'],
      'Boundary Scan': ['Boundary Scan Chain', 'Boundary Scan Control', 'Others'],
      'Memory BIST': ['Memory BIST Controller', 'Memory Test Algorithm', 'Others'],
      'Test Pattern Generation': ['ATPG', 'Test Pattern Optimization', 'Others'],
      'Test Application': ['Test Application Setup', 'Test Execution', 'Test Debug', 'Others']
    }
  },
  
  // Analog Layout Domain
  'Analog Layout': {
    stages: [
      'Schematic design inputs',
      'Floorplan',
      'Routing',
      'AL outputs',
      'RC extraction',
      'ECO',
      'EMIR',
      'Physical verification',
      'ESD',
      'Pads',
      'Package',
      'Technology & PDKs',
      'DB Version control',
      'Project Release & QA'
    ],
    issueCategories: {
      'Schematic design inputs': ['Matching (devices, nets - resistances, capacitance)', 'High speed', 'High Voltage', 'Different voltage domains', 'Clk & Data paths', 'Power (current & voltage) ratings', 'Branch currents', 'Node Voltages in cross voltage domains', 'Other'],
      'Floorplan': ['Devices Placement', 'Macro placement', 'Power planning', 'Different types of MOS devices', 'Different types of devices', 'Blocks integration', 'Analog & Digital blocks integration', 'Area', 'ESD & Clamps integration', 'Latchup', 'Other'],
      'Routing': ['Opens', 'Shorts', 'DRCs', 'High Speed signal routing', 'High Current', 'Power mesh', 'Crosstalk', 'Other'],
      'AL outputs': ['GDS', 'LEF', 'DEF', 'Netlist', 'PV reports', 'PERC & ESD reports', 'Other'],
      'RC extraction': ['Design updates', 'Post layout sims', 'LVS fail', 'Other'],
      'ECO': ['Design updates', 'Post layout sims updates', 'Clk & Data Timing', 'Other'],
      'EMIR': ['Static IR drop analysis', 'Dynamic IR drop analysis', 'Power EM Iavg', 'Power EM Irms', 'Signal EM Iavg', 'Signal EM Irms', 'EMIR calculations', 'Other'],
      'Physical verification': ['DRC', 'DFM', 'ANT', 'LVS', 'ERC', 'PERC', 'Bump', 'ESD', 'Density', 'Other'],
      'ESD': ['ESD types', 'ESD sizes', 'Clamps', 'Resistance', 'ESD voltage values', 'Other'],
      'Pads': ['Bond Pads', 'Different types of Bond pads', 'Probe pads', 'RDL Routing', 'Other'],
      'Package': ['CSP (Chip Scale package)', 'Wire bond', 'Other'],
      'Technology & PDKs': ['PDKs', 'Tech file', 'Display file', 'Metal stack (FEOL, MEOL, BEOL)', 'DRM (Design Rule Manual)', 'Rule decks', 'Other'],
      'DB Version control': ['Project DB', 'Layout Design DB', 'Schematic design DB', 'Check list DB', 'Design DB check-in', 'Design DB check-out', 'Design DB access or edit permission', 'Other'],
      'Project Release & QA': ['Devices used', 'Additional cost Masks', 'DB Prefixing', 'Shapes out side of Boundary', 'LEF vs GDS', 'LEF vs Verilog', 'Design Reviews', 'Cross team release', 'Other']
    }
  },
  
  // Analog Design Domain
  'Analog Design': {
    stages: [
      'Circuit Design',
      'Circuit Simulation',
      'Performance Analysis',
      'Design Optimization',
      'Monte Carlo Analysis',
      'Corner Analysis'
    ],
    issueCategories: {
      'Circuit Design': ['Circuit Topology', 'Component Sizing', 'Circuit Analysis', 'Others'],
      'Circuit Simulation': ['DC Analysis', 'AC Analysis', 'Transient Analysis', 'Others'],
      'Performance Analysis': ['Gain Analysis', 'Noise Analysis', 'Power Analysis', 'Others'],
      'Design Optimization': ['Performance Optimization', 'Power Optimization', 'Area Optimization', 'Others'],
      'Monte Carlo Analysis': ['Process Variation', 'Mismatch Analysis', 'Yield Analysis', 'Others'],
      'Corner Analysis': ['Process Corners', 'Temperature Corners', 'Voltage Corners', 'Others']
    }
  }
};

module.exports = domainConfig;
