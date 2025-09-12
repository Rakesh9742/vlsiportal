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
      'Synthesis': ['SDC', 'RTL', '.lib', 'Optimization', 'Timing', 'Area', 'Power', 'Clock gating', 'multibit flops', 'Tool', 'Others'],
      'Design initilization': ['Tech LEF', 'LEF', 'NDM', 'ITF', 'TLUPLUS', 'QRC tech', 'Netlist', 'SDC', 'MMMC', 'Tool', 'Others'],
      'Floorplan': ['Macro placement', 'power planning', 'endcap', 'tap cells', 'Placement blockages', 'Marco halo (keepout)', 'Tool', 'Others'],
      'Placement': ['SDC', 'Bounds', 'Port buffers', 'Setup timing', 'DRVs', 'Cell denisty', 'Pin density', 'congestion', 'Optimization', 'Scan reordering', 'Tool', 'Others'],
      'CTS': ['Clock skew', 'Clock latency', 'Clock tree exceptions', 'Clock cells', 'clock NDR', 'Clock routing', 'Congestion', 'cell density', 'CCD', 'CCOPT', 'Setup timing', 'Clock path DRVs', 'Clock gating setup', 'Tool'],
      'Post CTS opt': ['Hold cells', 'hold timing', 'setup timing', 'Congestion', 'cell density', 'DRVs', 'Clock path DRVs', 'Clock NDR', 'Clock routing', 'Clock gating setup', 'Clock gating hold', 'Tool'],
      'Routing': ['Antenna', 'Crosstalk', 'Detour', 'Open', 'short', 'DRCs', 'Setup timing', 'Hold Timing', 'DRVs', 'Clock DRVs', 'Clock DRCs', 'Preroute to postroute correlation', 'Tool'],
      'Post route opt': ['Antenna', 'Crosstalk', 'Detour', 'Open', 'short', 'DRCs', 'Setup timing', 'Hold Timing', 'DRVs', 'Clock DRVs', 'Clock DRCs', 'Preroute to postroute correlation', 'Tool'],
      'Filler insertion': ['Filler gaps', 'Decap density', 'flow issue', 'cell padding', 'Tool'],
      'PD outputs': ['DEF', 'LEF', 'Netlist', 'Physical Netlist', 'GDS', 'Tool'],
      'RC extraction': ['SPEF', 'Flow', 'Inputs', 'Shorts', 'Opens', 'Tool'],
      'ECO': ['Setup timing fixes', 'Hold timing fixes', 'ECO implementation', 'ECO flow', 'DRV fixes', 'Crosstalk delay fixes', 'Crosstalk noise fixes', 'Tool'],
      'STA': ['SDC', 'Flow', 'DMSA', 'Annotation', 'Setup timing', 'Hold timing', 'DRVs', 'Crosstalk Delay', 'Crosstalk noise', 'Clock DRVs', 'Clock gating Violations', 'ECO generation', 'Physical aware eco', 'Tool'],
      'EMIR': ['Static IR drop analysis', 'Dynamic vectorless analysis', 'Dynamic vectored analysis', 'Power EM', 'Signal EM', 'IR fix', 'IR hotspots', 'EM fix', 'Ploc file', 'Inputs', 'VCD', 'Tool', 'Others'],
      'Physical verification': ['DRC', 'LVS', 'Antenna', 'ERC', 'PERC', 'Bump', 'ESD', 'Tool'],
      'CLP': ['Isolation cell', 'Level shifter', 'Power switch', 'UPF', 'Tool'],
      'LEC': ['Settings', 'Debug Analysis', 'Tool']
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
      'Requirements Analysis': ['Ambiguous Requirements', 'Missing Requirements', 'Conflicting Requirements', 'Incomplete Requirements', 'Tool', 'Others'],
      'Functional Specification': ['Functional Gaps', 'Interface Issues', 'Protocol Issues', 'Tool', 'Others'],
      'Performance Specification': ['Performance Targets', 'Power Budget', 'Area Budget', 'Timing Constraints', 'Tool', 'Others'],
      'Interface Specification': ['Interface Definition', 'Protocol Specification', 'Signal Integrity', 'Tool', 'Others'],
      'Design Constraints': ['Timing Constraints', 'Power Constraints', 'Area Constraints', 'Tool', 'Others'],
      'Verification Plan': ['Coverage Plan', 'Test Strategy', 'Tool', 'Others']
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
      'System Architecture': ['Architecture Gaps', 'Performance Issues', 'Scalability Issues', 'Tool', 'Others'],
      'Block Level Design': ['Block Interface', 'Block Functionality', 'Block Integration', 'Tool', 'Others'],
      'Interface Design': ['Interface Protocol', 'Interface Timing', 'Interface Power', 'Tool', 'Others'],
      'Power Architecture': ['Power Distribution', 'Power Management', 'Power Efficiency', 'Tool', 'Others'],
      'Clock Architecture': ['Clock Distribution', 'Clock Domain', 'Clock Synchronization', 'Tool', 'Others'],
      'Memory Architecture': ['Memory Hierarchy', 'Memory Interface', 'Memory Performance', 'Tool', 'Others']
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
      'RTL Design': ['RTL Coding', 'RTL Optimization', 'RTL Integration', 'Tool', 'Others'],
      'RTL Verification': ['Functional Verification', 'Code Coverage', 'Tool', 'Others'],
      'Synthesis': ['Synthesis Issues', 'Timing Issues', 'Area Issues', 'Power Issues', 'Tool', 'Others'],
      'Timing Analysis': ['Setup Timing', 'Hold Timing', 'Clock Issues', 'Tool', 'Others'],
      'Power Analysis': ['Power Consumption', 'Power Distribution', 'Power Management', 'Tool', 'Others'],
      'Area Analysis': ['Area Utilization', 'Area Optimization', 'Tool', 'Others']
    }
  },
  
  // Design Verification Domain (DV) - Simplified structure without stages
  'Design Verification': {
    stages: [], // No stages for DV domain
    issueCategories: {
      'Specification': ['Document'],
      'Compilation': ['Synopsys VCS', 'Cadence Xcelium', 'Cadence Incisive', 'Questasim'],
      'Elaboration': ['Synopsys VCS', 'Cadence Xcelium', 'Cadence Incisive', 'Questasim'],
      'Simulation': ['Synopsys VCS', 'Cadence Xcelium', 'Cadence Incisive', 'Questasim'],
      'Waveform Loading': ['Synopsys Verdi', 'Cadence Simvision', 'Questasim'],
      'Debug / Logical Failures': ['Synopsys VCS', 'Cadence Xcelium', 'Cadence Incisive', 'Questasim'],
      'GLS / SDF Debug': ['Synopsys VCS', 'Cadence Xcelium', 'Cadence Incisive', 'Questasim'],
      'Coverage Analysis': ['Synopsys URG', 'Cadence IMC'],
      'Regression Analysis': ['Vmanager'],
      'Repository': ['Git', 'SVN', 'Perforce'],
      'Scripts / Tool Launch': ['Shell script', 'SLURM', 'Python']
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
      'Scan Design': ['Scan Chain', 'Scan Compression', 'Scan Timing', 'Tool', 'Others'],
      'BIST Design': ['BIST Architecture', 'BIST Controller', 'BIST Pattern', 'Tool', 'Others'],
      'Boundary Scan': ['Boundary Scan Chain', 'Boundary Scan Control', 'Tool', 'Others'],
      'Memory BIST': ['Memory BIST Controller', 'Memory Test Algorithm', 'Tool', 'Others'],
      'Test Pattern Generation': ['ATPG', 'Test Pattern Optimization', 'Tool', 'Others'],
      'Test Application': ['Test Application Setup', 'Test Execution', 'Test Debug', 'Tool', 'Others']
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
      'Schematic design inputs': ['Matching (devices, nets - resistances, capacitance)', 'High speed', 'High Voltage', 'Different voltage domains', 'Clk & Data paths', 'Power (current & voltage) ratings', 'Branch currents', 'Node Voltages in cross voltage domains', 'Tool'],
      'Floorplan': ['Devices Placement', 'Macro placement', 'Power planning', 'Different types of MOS devices', 'Different types of devices', 'Blocks integration', 'Analog & Digital blocks integration', 'Area', 'ESD & Clamps integration', 'Latchup', 'Tool'],
      'Routing': ['Opens', 'Shorts', 'DRCs', 'High Speed signal routing', 'High Current', 'Power mesh', 'Crosstalk', 'Tool'],
      'AL outputs': ['GDS', 'LEF', 'DEF', 'Netlist', 'PV reports', 'PERC & ESD reports', 'Tool'],
      'RC extraction': ['Design updates', 'Post layout sims', 'LVS fail', 'Tool'],
      'ECO': ['Design updates', 'Post layout sims updates', 'Clk & Data Timing', 'Tool'],
      'EMIR': ['Static IR drop analysis', 'Dynamic IR drop analysis', 'Power EM Iavg', 'Power EM Irms', 'Signal EM Iavg', 'Signal EM Irms', 'EMIR calculations', 'Tool'],
      'Physical verification': ['DRC', 'DFM', 'ANT', 'LVS', 'ERC', 'PERC', 'Bump', 'ESD', 'Density', 'Tool'],
      'ESD': ['ESD types', 'ESD sizes', 'Clamps', 'Resistance', 'ESD voltage values', 'Tool'],
      'Pads': ['Bond Pads', 'Different types of Bond pads', 'Probe pads', 'RDL Routing', 'Tool'],
      'Package': ['CSP (Chip Scale package)', 'Wire bond', 'Tool'],
      'Technology & PDKs': ['PDKs', 'Tech file', 'Display file', 'Metal stack (FEOL, MEOL, BEOL)', 'DRM (Design Rule Manual)', 'Rule decks', 'Tool'],
      'DB Version control': ['Project DB', 'Layout Design DB', 'Schematic design DB', 'Check list DB', 'Design DB check-in', 'Design DB check-out', 'Design DB access or edit permission', 'Tool'],
      'Project Release & QA': ['Devices used', 'Additional cost Masks', 'DB Prefixing', 'Shapes out side of Boundary', 'LEF vs GDS', 'LEF vs Verilog', 'Design Reviews', 'Cross team release', 'Tool']
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
      'Circuit Design': ['Circuit Topology', 'Component Sizing', 'Circuit Analysis', 'Tool', 'Others'],
      'Circuit Simulation': ['DC Analysis', 'AC Analysis', 'Transient Analysis', 'Tool', 'Others'],
      'Performance Analysis': ['Gain Analysis', 'Noise Analysis', 'Power Analysis', 'Tool', 'Others'],
      'Design Optimization': ['Performance Optimization', 'Power Optimization', 'Area Optimization', 'Tool', 'Others'],
      'Monte Carlo Analysis': ['Process Variation', 'Mismatch Analysis', 'Yield Analysis', 'Tool', 'Others'],
      'Corner Analysis': ['Process Corners', 'Temperature Corners', 'Voltage Corners', 'Tool', 'Others']
    }
  }
};

module.exports = domainConfig;
