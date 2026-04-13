import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Database, 
  AlertTriangle, 
  Info, 
  Zap, 
  Lock, 
  Unlock,
  BarChart3,
  Terminal,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Packet, Stats, ChartData, Protocol, AttackType, Classification } from './types';

const PROTOCOLS: Protocol[] = ['TCP', 'UDP', 'ICMP', 'HTTP', 'DNS'];
const ATTACK_TYPES: AttackType[] = ['SYN Flood', 'UDP Flood', 'ICMP Flood', 'HTTP GET Flood', 'DNS Amplification'];

const generateIp = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

export default function App() {
  // Simulation State
  const [isAttackActive, setIsAttackActive] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [currentAttackType, setCurrentAttackType] = useState<AttackType>('None');
  const [packets, setPackets] = useState<Packet[]>([]);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Stats>({
    serverLoad: 5,
    totalRequests: 0,
    attacksDetected: 0,
    ipsBlocked: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis' | 'info'>('dashboard');
  const [showAlert, setShowAlert] = useState(false);

  const packetIdCounter = useRef(0);

  // Initialize chart data
  useEffect(() => {
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      time: `${i}:00`,
      normal: 0,
      attack: 0,
      blocked: 0
    }));
    setChartData(initialData);
  }, []);

  // Packet Generation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const isActuallyAttack = isAttackActive && Math.random() > 0.1;
      const sourceIp = generateIp();
      
      const newPacket: Packet = {
        id: `pkt-${packetIdCounter.current++}`,
        timestamp: new Date().toLocaleTimeString(),
        sourceIp: sourceIp,
        requestRate: isActuallyAttack ? Math.floor(Math.random() * 50) + 90 : Math.floor(Math.random() * 10) + 2,
        payloadSize: isActuallyAttack ? Math.floor(Math.random() * 400) + 600 : Math.floor(Math.random() * 120) + 40,
        protocol: isActuallyAttack ? (currentAttackType === 'SYN Flood' ? 'TCP' : currentAttackType === 'UDP Flood' ? 'UDP' : currentAttackType === 'ICMP Flood' ? 'ICMP' : currentAttackType === 'HTTP GET Flood' ? 'HTTP' : 'DNS') : PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)],
        classification: 'Inspecting...',
        confidence: 0,
        isBlocked: blockedIps.has(sourceIp)
      };

      setPackets(prev => [newPacket, ...prev].slice(0, 50));
      setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));

      // Simulated ML Inspection
      setTimeout(() => {
        setPackets(prev => prev.map(p => {
          if (p.id === newPacket.id) {
            const isAttack = p.requestRate > 80 || p.payloadSize > 500;
            const confidence = Math.floor(Math.random() * 14) + 85;
            
            if (isAttack && isShieldActive) {
              setBlockedIps(prevBlocked => {
                const next = new Set(prevBlocked);
                next.add(p.sourceIp);
                return next;
              });
            }

            return {
              ...p,
              classification: isAttack ? 'Attack' : 'Normal',
              confidence
            };
          }
          return p;
        }));

        if (newPacket.requestRate > 80 || newPacket.payloadSize > 500) {
          setStats(prev => ({ ...prev, attacksDetected: prev.attacksDetected + 1 }));
        }
      }, 1000);

    }, 800);

    return () => clearInterval(interval);
  }, [isAttackActive, isShieldActive, currentAttackType, blockedIps]);

  // Update Stats & Charts
  useEffect(() => {
    const interval = setInterval(() => {
      const recentPackets = packets.slice(0, 10);
      const normalCount = recentPackets.filter(p => p.classification === 'Normal').length;
      const attackCount = recentPackets.filter(p => p.classification === 'Attack' && !p.isBlocked).length;
      const blockedCount = recentPackets.filter(p => p.isBlocked || (p.classification === 'Attack' && isShieldActive)).length;

      const load = Math.min(100, (isAttackActive ? 85 : 5) + (Math.random() * 10));

      setStats(prev => ({
        ...prev,
        serverLoad: Math.floor(load),
        ipsBlocked: blockedIps.size
      }));

      setChartData(prev => {
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          normal: normalCount,
          attack: attackCount,
          blocked: blockedCount
        }];
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [packets, isAttackActive, isShieldActive, blockedIps]);

  // Attack Toggle Logic
  const toggleAttack = () => {
    if (!isAttackActive) {
      const type = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
      setCurrentAttackType(type);
      setIsAttackActive(true);
      setShowAlert(true);
    } else {
      setIsAttackActive(false);
      setCurrentAttackType('None');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-5xl md:text-7xl mb-2 tracking-tighter">DDOS Attack</h1>
          <p className="font-mono text-sm opacity-60 uppercase tracking-widest">Real-time ML Detection Simulator</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={toggleAttack}
            className={cn(
              "brutal-btn flex items-center gap-2",
              isAttackActive ? "bg-danger text-white" : "bg-white"
            )}
          >
            <Zap className={cn("w-5 h-5", isAttackActive && "fill-current")} />
            {isAttackActive ? "Stop Attack" : "Simulate DDoS Attack"}
          </button>
          <button 
            onClick={() => setIsShieldActive(!isShieldActive)}
            className={cn(
              "brutal-btn flex items-center gap-2",
              isShieldActive ? "bg-safe text-white" : "bg-white"
            )}
          >
            {isShieldActive ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            Prevention Shield: {isShieldActive ? "ON" : "OFF"}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex border-b-2 border-ink mb-8">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'analysis', label: 'ML Analysis', icon: BarChart3 },
          { id: 'info', label: 'Project Info', icon: Info },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-3 font-bold flex items-center gap-2 transition-colors",
              activeTab === tab.id 
                ? "bg-ink text-white" 
                : "hover:bg-white/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {/* Stats Cards */}
            <div className="brutal-card flex flex-col justify-between">
              <span className="font-mono text-xs uppercase opacity-60 mb-2">Server Load</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold">{stats.serverLoad}%</span>
                <div className="w-12 h-12 bg-ink/5 rounded-full flex items-center justify-center">
                  <Activity className={cn("w-6 h-6", stats.serverLoad > 80 ? "text-danger animate-pulse" : "text-safe")} />
                </div>
              </div>
              <div className="mt-4 h-2 bg-ink/10 overflow-hidden">
                <motion.div 
                  className={cn("h-full", stats.serverLoad > 80 ? "bg-danger" : "bg-safe")}
                  animate={{ width: `${stats.serverLoad}%` }}
                />
              </div>
            </div>

            <div className="brutal-card flex flex-col justify-between">
              <span className="font-mono text-xs uppercase opacity-60 mb-2">Total Requests</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold">{stats.totalRequests.toLocaleString()}</span>
                <Database className="w-6 h-6 opacity-20" />
              </div>
            </div>

            <div className="brutal-card flex flex-col justify-between">
              <span className="font-mono text-xs uppercase opacity-60 mb-2">Attacks Detected</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-danger">{stats.attacksDetected}</span>
                <ShieldAlert className="w-6 h-6 text-danger opacity-40" />
              </div>
            </div>

            <div className="brutal-card flex flex-col justify-between">
              <span className="font-mono text-xs uppercase opacity-60 mb-2">IPs Blocked</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold">{stats.ipsBlocked}</span>
                <Lock className="w-6 h-6 opacity-20" />
              </div>
            </div>

            {/* Main Chart */}
            <div className="md:col-span-3 brutal-card min-h-[400px]">
              <h2 className="text-2xl mb-6">Traffic Volume Analysis</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAttack" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141420" />
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#141414" fontSize={12} fontFamily="JetBrains Mono" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '2px solid #141414',
                        borderRadius: '0px',
                        boxShadow: '4px 4px 0px 0px rgba(20,20,20,1)'
                      }}
                    />
                    <Area type="monotone" dataKey="normal" stroke="#10b981" fillOpacity={1} fill="url(#colorNormal)" strokeWidth={3} />
                    <Area type="monotone" dataKey="attack" stroke="#dc2626" fillOpacity={1} fill="url(#colorAttack)" strokeWidth={3} />
                    <Area type="monotone" dataKey="blocked" stroke="#141414" fillOpacity={0.1} fill="#141414" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Blocked IPs List */}
            <div className="brutal-card flex flex-col">
              <h2 className="text-2xl mb-4">Blocked Registry</h2>
              <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2 pr-2">
                <AnimatePresence initial={false}>
                  {Array.from(blockedIps).reverse().map((ip) => (
                    <motion.div
                      key={ip}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="flex items-center justify-between p-2 bg-danger/10 border border-danger/20"
                    >
                      <span className="font-mono text-xs">{ip}</span>
                      <Lock className="w-3 h-3 text-danger" />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {blockedIps.size === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 py-12">
                    <Unlock className="w-8 h-8 mb-2" />
                    <p className="text-xs font-mono">No active blocks</p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Logs */}
            <div className="md:col-span-4 brutal-card overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl">Live Traffic Log</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-ink text-white font-mono text-[10px] uppercase tracking-tighter">
                  <div className="w-2 h-2 bg-safe rounded-full animate-pulse" />
                  Real-time Stream
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-ink bg-ink/5">
                      <th className="p-3 font-mono text-[10px] uppercase opacity-60">Timestamp</th>
                      <th className="p-3 font-mono text-[10px] uppercase opacity-60">Source IP</th>
                      <th className="p-3 font-mono text-[10px] uppercase opacity-60">Rate (req/s)</th>
                      <th className="p-3 font-mono text-[10px] uppercase opacity-60">Payload (KB)</th>
                      <th className="p-3 font-mono text-[10px] uppercase opacity-60">Protocol</th>
                      <th className="p-3 font-mono text-[10px] uppercase opacity-60">Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {packets.map((packet) => (
                        <motion.tr 
                          key={packet.id}
                          initial={{ opacity: 0, backgroundColor: '#fff' }}
                          animate={{ 
                            opacity: 1,
                            backgroundColor: packet.classification === 'Inspecting...' && packet.requestRate > 80 ? '#fef08a' : '#fff'
                          }}
                          className={cn(
                            "border-b border-ink/10 group hover:bg-ink/5 transition-colors",
                            packet.classification === 'Inspecting...' && packet.requestRate > 80 && "animate-pulse"
                          )}
                        >
                          <td className="p-3 font-mono text-xs">{packet.timestamp}</td>
                          <td className="p-3 font-mono text-xs font-bold">{packet.sourceIp}</td>
                          <td className="p-3 font-mono text-xs">{packet.requestRate}</td>
                          <td className="p-3 font-mono text-xs">{packet.payloadSize}</td>
                          <td className="p-3 font-mono text-xs">
                            <span className="px-2 py-0.5 border border-ink/20 text-[10px] font-bold">
                              {packet.protocol}
                            </span>
                          </td>
                          <td className="p-3 relative">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-mono text-[10px] font-bold uppercase px-2 py-0.5",
                                packet.classification === 'Normal' && "bg-safe/20 text-safe",
                                packet.classification === 'Attack' && "bg-danger/20 text-danger",
                                packet.classification === 'Inspecting...' && "bg-ink/10 text-ink opacity-50"
                              )}>
                                {packet.classification}
                                {packet.classification !== 'Inspecting...' && ` (${packet.confidence}%)`}
                              </span>
                              {packet.isBlocked && <Lock className="w-3 h-3 text-danger" />}
                            </div>
                            
                            {/* Feature Vector Tooltip */}
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-20">
                              <div className="brutal-card p-3 bg-white text-xs font-mono whitespace-nowrap shadow-sm">
                                <p className="text-ink/60 mb-1 uppercase text-[9px]">Feature Vector</p>
                                <p>Rate: {packet.requestRate} req/s</p>
                                <p>Size: {packet.payloadSize} KB</p>
                                <p>Proto: {packet.protocol}</p>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analysis' && (
          <motion.div 
            key="analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="brutal-card">
              <h2 className="text-2xl mb-6">Feature Importance</h2>
              <p className="text-sm opacity-70 mb-8">Random Forest Gini Importance analysis for traffic classification features.</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={[
                      { name: 'Request Rate', value: 0.42 },
                      { name: 'Payload Size', value: 0.31 },
                      { name: 'Protocol Flags', value: 0.15 },
                      { name: 'Packet Interval', value: 0.08 },
                      { name: 'TTL Variance', value: 0.04 },
                    ]}
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#141414" fontSize={12} width={100} />
                    <Tooltip 
                      cursor={{ fill: '#14141410' }}
                      contentStyle={{ border: '2px solid #141414', borderRadius: '0px' }}
                    />
                    <Bar dataKey="value" fill="#141414" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="brutal-card">
              <h2 className="text-2xl mb-6">2D Decision Boundary</h2>
              <p className="text-sm opacity-70 mb-8">Visualization of the "Attack Zone" vs "Safe Zone" based on key features.</p>
              <div className="h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#14141410" />
                    <XAxis type="number" dataKey="x" name="Request Rate" unit=" req/s" stroke="#141414" />
                    <YAxis type="number" dataKey="y" name="Payload Size" unit=" KB" stroke="#141414" />
                    <ZAxis type="number" range={[50, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    {/* Safe Zone Data */}
                    <Scatter 
                      name="Safe Zone" 
                      data={Array.from({ length: 30 }, () => ({ x: Math.random() * 40, y: Math.random() * 200 }))} 
                      fill="#10b981" 
                      opacity={0.6}
                    />
                    {/* Attack Zone Data */}
                    <Scatter 
                      name="Attack Zone" 
                      data={Array.from({ length: 30 }, () => ({ x: 80 + Math.random() * 60, y: 500 + Math.random() * 500 }))} 
                      fill="#dc2626" 
                      opacity={0.6}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
                {/* Decision Boundary Line Overlay */}
                <div className="absolute inset-0 pointer-events-none border-l-4 border-t-4 border-dashed border-ink/20 ml-[60px] mt-[40px] w-[60%] h-[60%]" />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'info' && (
          <motion.div 
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto space-y-8"
          >
            <div className="brutal-card">
              <h2 className="text-3xl mb-4">Mission Statement</h2>
              <p className="leading-relaxed">
                The **DDOS Attack Simulator** is an educational tool designed to visualize the power of Machine Learning in cybersecurity. 
                By simulating high-velocity network traffic, we demonstrate how Random Forest models can distinguish between legitimate user behavior 
                and malicious flooding attacks with high precision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="brutal-card">
                <h3 className="text-xl mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5" /> Tech Stack
                </h3>
                <ul className="space-y-2 font-mono text-sm">
                  <li>• Python / Scikit-learn</li>
                  <li>• CICDDoS2019 Dataset</li>
                  <li>• React / TypeScript</li>
                  <li>• Framer Motion</li>
                </ul>
              </div>
              <div className="brutal-card">
                <h3 className="text-xl mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Challenges
                </h3>
                <ul className="space-y-2 font-mono text-sm">
                  <li>• Real-time Latency</li>
                  <li>• Feature Engineering</li>
                  <li>• Overfitting Prevention</li>
                  <li>• Large Dataset Handling</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Critical Alert Modal */}
      <AnimatePresence>
        {showAlert && isAttackActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="brutal-card max-w-lg w-full bg-white relative"
            >
              <button 
                onClick={() => setShowAlert(false)}
                className="absolute top-4 right-4 p-2 hover:bg-ink/5 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-4 mb-6 text-danger">
                <AlertTriangle className="w-12 h-12 animate-bounce" />
                <h2 className="text-4xl">CRITICAL ALERT</h2>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-danger/10 border-l-4 border-danger">
                  <p className="font-mono text-xs uppercase opacity-60 mb-1">Attack Type Detected</p>
                  <p className="text-xl font-bold">{currentAttackType}</p>
                </div>
                <div className="p-4 bg-ink/5 border-l-4 border-ink">
                  <p className="font-mono text-xs uppercase opacity-60 mb-1">Targeted Resource</p>
                  <p className="text-xl font-bold">192.168.1.104 (Main Gateway)</p>
                </div>
              </div>

              {!isShieldActive && (
                <button 
                  onClick={() => {
                    setIsShieldActive(true);
                    setShowAlert(false);
                  }}
                  className="w-full brutal-btn-danger py-4 text-xl flex items-center justify-center gap-3"
                >
                  <ShieldCheck className="w-6 h-6" />
                  Turn On Shield Now
                </button>
              )}
              
              <button 
                onClick={() => setShowAlert(false)}
                className="w-full mt-4 brutal-btn py-2 opacity-60 hover:opacity-100"
              >
                Dismiss Warning
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t-2 border-ink flex flex-col md:flex-row justify-between items-center gap-4 opacity-40 font-mono text-[10px] uppercase tracking-widest">
        <p>© 2026 CYBER-DEFENSE COMMAND CENTER</p>
        <div className="flex gap-6">
          <span>SECURE_PROTOCOL_V4.2</span>
          <span>LATENCY: 14MS</span>
          <span>ENCRYPTION: AES-256</span>
        </div>
      </footer>
    </div>
  );
}
