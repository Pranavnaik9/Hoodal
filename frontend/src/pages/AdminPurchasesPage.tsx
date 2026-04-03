import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Filter, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Product } from '../types';
import { format } from 'date-fns';

const UNIT_DEFAULTS: Record<string, number> = { PCS: 1, OUTER: 12, BOX: 24 };

export function AdminPurchasesPage() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);

    // --- Filters (Feature 7) ---
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterSupplierId, setFilterSupplierId] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // --- Detail modal (Feature 4) ---
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailPurchase, setDetailPurchase] = useState<any>(null);

    // Purchase form state
    const [supplierId, setSupplierId] = useState('');

    const [items, setItems] = useState<{
        productId: string; quantity: number; price: number;
        unitType: string; conversionFactor: number; totalInclGst: number;
    }[]>([{ productId: '', quantity: 1, price: 0, unitType: 'PCS', conversionFactor: 1, totalInclGst: 0 }]);
    const [amountPaid, setAmountPaid] = useState<number | ''>('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [isFullPaid, setIsFullPaid] = useState(true);

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentRef, setPaymentRef] = useState('');

    const loadInitialData = async () => {
        try {
            const [supRes, prodRes] = await Promise.all([
                apiClient.get('/suppliers'),
                apiClient.get('/products')
            ]);
            setSuppliers(supRes.data);
            setProducts(prodRes.data);
        } catch {
            toast.error('Failed to load data');
        }
    };

    const fetchPurchases = async () => {
        try {
            const params = new URLSearchParams();
            if (filterDateFrom) params.append('dateFrom', filterDateFrom);
            if (filterDateTo) params.append('dateTo', filterDateTo);
            if (filterStatus && filterStatus !== 'ALL') params.append('status', filterStatus);
            if (filterSupplierId) params.append('supplierId', filterSupplierId);

            const res = await apiClient.get(`/purchases?${params.toString()}`);
            setPurchases(res.data);
        } catch {
            toast.error('Failed to load purchases');
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([loadInitialData(), fetchPurchases()]);
            setLoading(false);
        };
        init();
    }, []);

    // Re-fetch when filters change
    useEffect(() => {
        fetchPurchases();
    }, [filterDateFrom, filterDateTo, filterStatus, filterSupplierId]);



    // Feature 4: View purchase details
    const handleViewDetail = async (id: string) => {
        try {
            const res = await apiClient.get(`/purchases/${id}`);
            setDetailPurchase(res.data);
            setShowDetailModal(true);
        } catch {
            toast.error('Failed to load purchase details');
        }
    };

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, price: 0, unitType: 'PCS', conversionFactor: 1, totalInclGst: 0 }]);
    };

    const handleUpdateItem = (index: number, field: string, value: string | number) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const handleSelectProduct = (index: number, productId: string) => {
        const prod = products.find(p => p.id === productId);
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, productId, price: prod ? (prod.costPrice || 0) : item.price, totalInclGst: 0 } : item
        ));
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    // Feature 6: Unit change handler
    const handleUnitChange = (index: number, unitType: string) => {
        const conversionFactor = UNIT_DEFAULTS[unitType] || 1;
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, unitType, conversionFactor } : item
        ));
    };

    // Feature 5: GST back-calculation
    const handleTotalInclGstChange = (index: number, totalInclGst: number) => {
        const item = items[index];
        const prod = products.find(p => p.id === item.productId);
        const gstRate = prod?.gstRate || 0;

        // Back-calculate base price per unit from total inclusive amount
        const totalBase = gstRate > 0 ? totalInclGst / (1 + gstRate / 100) : totalInclGst;
        const basePrice = item.quantity > 0 ? Math.round(totalBase / item.quantity * 100) / 100 : 0;

        setItems(prev => prev.map((it, i) =>
            i === index ? { ...it, totalInclGst, price: basePrice } : it
        ));
    };

    const getItemGstRate = (productId: string) => {
        return products.find(p => p.id === productId)?.gstRate || 0;
    };

    const totalAmount = items.reduce((sum, item) => {
        const gstRate = getItemGstRate(item.productId);
        const baseTotal = item.quantity * item.price;
        return sum + baseTotal + (baseTotal * gstRate / 100);
    }, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/purchases', {
                supplierId,
                items: items.map(i => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    price: i.price,
                    unitType: i.unitType,
                    conversionFactor: i.conversionFactor
                })),
                amountPaid: isFullPaid ? totalAmount : (Number(amountPaid) || 0),
                orderDate,
                paymentMode
            });
            toast.success('Purchase recorded successfully');
            setShowModal(false);
            setSupplierId('');
            setItems([{ productId: '', quantity: 1, price: 0, unitType: 'PCS', conversionFactor: 1, totalInclGst: 0 }]);
            setAmountPaid('');

            fetchPurchases();
        } catch {
            toast.error('Failed to record purchase');
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPurchase || !paymentAmount) return;

        try {
            await apiClient.post(`/purchases/${selectedPurchase.id}/payments`, {
                amount: Number(paymentAmount),
                paymentMode,
                date: paymentDate,
                referenceNo: paymentRef
            });
            toast.success('Payment recorded successfully');
            setShowPaymentModal(false);
            setPaymentAmount('');
            setPaymentRef('');
            fetchPurchases();
        } catch {
            toast.error('Failed to record payment');
        }
    };

    const clearFilters = () => {
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterStatus('ALL');
        setFilterSupplierId('');
    };

    const hasActiveFilters = filterDateFrom || filterDateTo || filterStatus !== 'ALL' || filterSupplierId;

    const filtered = purchases.filter(p =>
        !search || p.supplier?.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;

    const getStatusColor = (status: string) => {
        if (status === 'PAID') return 'bg-emerald-500/20 text-emerald-400';
        if (status === 'PARTIAL') return 'bg-yellow-500/20 text-yellow-400';
        return 'bg-red-500/20 text-red-400';
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Purchases</h2>
                <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all text-sm">
                    <Plus className="h-4 w-4" /> Record Purchase
                </button>
            </div>

            {/* Search + Filter Toggle */}
            <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search purchases by supplier..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${hasActiveFilters ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                    <Filter className="h-4 w-4" /> Filters {hasActiveFilters && <span className="bg-indigo-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">!</span>}
                </button>
            </div>

            {/* Feature 7: Filters Panel */}
            {showFilters && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><Calendar className="h-4 w-4" /> Filter Purchases</h4>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><X className="h-3 w-3" /> Clear All</button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Date From</label>
                            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Date To</label>
                            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Status</label>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="PAID">Paid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Supplier</label>
                            <select value={filterSupplierId} onChange={e => setFilterSupplierId(e.target.value)}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                                <option value="">All Suppliers</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Purchases Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr className="text-gray-400 text-xs uppercase">
                            <th className="text-left px-4 py-3">Date</th>
                            <th className="text-left px-4 py-3">Supplier</th>
                            <th className="text-right px-4 py-3">Items</th>
                            <th className="text-right px-4 py-3">Total Amount</th>
                            <th className="text-right px-4 py-3">Paid</th>
                            <th className="text-right px-4 py-3">Balance</th>
                            <th className="text-center px-4 py-3">Status</th>
                            <th className="text-right px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map(purchase => (
                            <tr key={purchase.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-white font-medium">{new Date(purchase.orderDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-gray-300">{purchase.supplier?.name || 'Unknown'}</td>
                                <td className="px-4 py-3 text-right text-gray-400 text-sm">{purchase._count?.PurchaseItem || 0}</td>
                                <td className="px-4 py-3 text-right text-indigo-400 font-medium">₹{purchase.totalAmount.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right text-emerald-400">₹{purchase.amountPaid.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right text-red-400">₹{(purchase.totalAmount - purchase.amountPaid).toFixed(2)}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${getStatusColor(purchase.paymentStatus)}`}>
                                        {purchase.paymentStatus}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleViewDetail(purchase.id)}
                                            className="text-gray-400 hover:text-indigo-400 transition-colors" title="View Details">
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        {purchase.paymentStatus !== 'PAID' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedPurchase(purchase);
                                                    setPaymentAmount(Number((purchase.totalAmount - purchase.amountPaid).toFixed(2)));
                                                    setShowPaymentModal(true);
                                                }}
                                                className="text-xs bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                Pay Balance
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No purchases found</p>}
            </div>

            {/* ========== NEW PURCHASE MODAL ========== */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-3xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-white mb-6">Record New Purchase</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
                                    <select required value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white">
                                        <option value="">Select a supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Order Date</label>
                                    <input type="date" required value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-300">Products</label>
                                    <button type="button" onClick={handleAddItem} className="text-indigo-400 text-sm hover:text-indigo-300 flex items-center gap-1">
                                        <Plus className="h-3 w-3" /> Add Item
                                    </button>
                                </div>
                                {/* Column Headers */}
                                <div className="flex gap-2 mb-2 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                    <div className="flex-1">Product</div>
                                    <div className="w-16 text-center">Unit</div>
                                    <div className="w-14 text-center">Conv.</div>
                                    <div className="w-16 text-center">Qty</div>
                                    <div className="w-24 text-center">Base Rate ₹</div>
                                    <div className="w-14 text-center">GST%</div>
                                    <div className="w-24 text-center">Total ₹</div>
                                    <div className="w-16 text-center text-indigo-400">Pcs</div>
                                    <div className="w-6"></div>
                                </div>
                                <div className="space-y-3">
                                    {items.map((item, index) => {
                                        const gstRate = getItemGstRate(item.productId);
                                        const baseTotal = item.quantity * item.price;
                                        const totalWithGst = baseTotal + (baseTotal * gstRate / 100);
                                        const pcsQty = item.quantity * item.conversionFactor;


                                        return (
                                            <div key={index} className="space-y-1">
                                                <div className="flex gap-2 items-center">
                                                    <div className="flex-1">
                                                        <select required value={item.productId} onChange={e => handleSelectProduct(index, e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                                                            <option value="">Select product</option>
                                                            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} — ₹{p.costPrice || 0}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="w-16">
                                                        <select value={item.unitType} onChange={e => handleUnitChange(index, e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg px-1 py-2 text-white text-xs text-center">
                                                            <option value="PCS">PCS</option>
                                                            <option value="OUTER">OUTER</option>
                                                            <option value="BOX">BOX</option>
                                                        </select>
                                                    </div>
                                                    <div className="w-14">
                                                        <input type="number" min="1" value={item.conversionFactor}
                                                            onChange={e => handleUpdateItem(index, 'conversionFactor', Number(e.target.value) || 1)}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-1 py-2 text-white text-xs text-center"
                                                            title="Conversion factor (pcs per unit)" />
                                                    </div>
                                                    <div className="w-16">
                                                        <input type="number" min="1" required placeholder="Qty" value={item.quantity}
                                                            onChange={e => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-2 text-white text-xs text-center" />
                                                    </div>
                                                    <div className="w-24">
                                                        <input type="number" min="0" step="0.01" required placeholder="Base ₹" value={item.price}
                                                            onChange={e => handleUpdateItem(index, 'price', Number(e.target.value))}
                                                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-2 text-white text-xs text-center" />
                                                    </div>
                                                    <div className="w-14 text-center text-gray-400 text-xs">{gstRate}%</div>
                                                    <div className="w-24">
                                                        <input type="number" min="0" step="0.01" placeholder="Total ₹"
                                                            value={item.totalInclGst || (totalWithGst > 0 ? totalWithGst.toFixed(2) : '')}
                                                            onChange={e => handleTotalInclGstChange(index, Number(e.target.value))}
                                                            className="w-full bg-slate-900 border border-indigo-500/30 rounded-lg px-2 py-2 text-indigo-300 text-xs text-center"
                                                            title="Enter total inclusive of GST to auto-calculate base rate" />
                                                    </div>
                                                    <div className="w-16 text-center text-indigo-400 text-xs font-bold">{pcsQty} pcs</div>
                                                    {items.length > 1 && (
                                                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-gray-500 hover:text-red-400 w-6 flex-shrink-0 text-sm">✕</button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Total Amount</label>
                                    <div className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-xl">₹{totalAmount.toFixed(2)}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Payment Completion</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-white/5">
                                        <button type="button" onClick={() => setIsFullPaid(true)} className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${isFullPaid ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>FULL PAID</button>
                                        <button type="button" onClick={() => setIsFullPaid(false)} className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${!isFullPaid ? 'bg-yellow-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>KEEP BALANCE</button>
                                    </div>
                                </div>
                            </div>

                            {!isFullPaid && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Immediate Payment (₹)</label>
                                        <input type="number" min="0" max={totalAmount} value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value) || '')} placeholder="Amount paid now..." className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Payment Mode</label>
                                        <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm">
                                            <option value="CASH">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {isFullPaid && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Payment Mode</label>
                                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm">
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl transition-colors font-medium">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl transition-colors font-medium">Record Purchase</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========== PURCHASE DETAIL MODAL (Feature 4) ========== */}
            {showDetailModal && detailPurchase && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-white/10 flex flex-col">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white">Purchase Details</h3>
                                <p className="text-sm text-gray-400">
                                    {detailPurchase.supplier?.name} · {format(new Date(detailPurchase.orderDate), 'dd MMM yyyy')}
                                </p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-gray-400 text-xs uppercase mb-1">Total Amount</p>
                                    <p className="text-xl font-bold text-white">₹{detailPurchase.totalAmount.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-gray-400 text-xs uppercase mb-1">Paid</p>
                                    <p className="text-xl font-bold text-green-400">₹{detailPurchase.amountPaid.toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-gray-400 text-xs uppercase mb-1">Balance</p>
                                    <p className={`text-xl font-bold ${(detailPurchase.totalAmount - detailPurchase.amountPaid) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        ₹{(detailPurchase.totalAmount - detailPurchase.amountPaid).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Items ({detailPurchase.PurchaseItem?.length || 0})</h4>
                                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white/5">
                                            <tr className="text-gray-400 text-xs uppercase">
                                                <th className="text-left px-4 py-2">Product</th>
                                                <th className="text-center px-3 py-2">Qty</th>
                                                <th className="text-center px-3 py-2">Unit</th>
                                                <th className="text-right px-3 py-2">Base Rate</th>
                                                <th className="text-center px-3 py-2">GST</th>
                                                <th className="text-right px-4 py-2">Line Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {detailPurchase.PurchaseItem?.map((item: any) => {
                                                const lineBase = item.quantity * item.price;
                                                const lineTotal = lineBase + item.gstAmount;
                                                return (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-2 text-white">{item.product?.name || 'Unknown'}</td>
                                                        <td className="px-3 py-2 text-center text-white">
                                                            {item.quantity}
                                                            {item.pcsQuantity > 0 && item.unitType !== 'PCS' && (
                                                                <span className="text-[10px] text-indigo-400 block">({item.pcsQuantity} pcs)</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-gray-400 text-xs">{item.unitType || 'PCS'}</td>
                                                        <td className="px-3 py-2 text-right text-white">₹{item.price.toFixed(2)}</td>
                                                        <td className="px-3 py-2 text-center text-gray-400 text-xs">{item.gstRate}% (₹{item.gstAmount.toFixed(2)})</td>
                                                        <td className="px-4 py-2 text-right text-indigo-400 font-medium">₹{lineTotal.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payment History (if available) */}
                            {detailPurchase.supplierPayments && detailPurchase.supplierPayments.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Payment History</h4>
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5">
                                                <tr className="text-gray-400 text-xs uppercase">
                                                    <th className="text-left px-4 py-2">Date</th>
                                                    <th className="text-left px-4 py-2">Mode</th>
                                                    <th className="text-left px-4 py-2">Reference</th>
                                                    <th className="text-right px-4 py-2">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {detailPurchase.supplierPayments.map((pay: any) => (
                                                    <tr key={pay.id}>
                                                        <td className="px-4 py-2 text-white">{format(new Date(pay.date), 'dd MMM yyyy')}</td>
                                                        <td className="px-4 py-2 text-gray-400">{pay.paymentMode}</td>
                                                        <td className="px-4 py-2 text-gray-500 text-xs">{pay.referenceNo || '—'}</td>
                                                        <td className="px-4 py-2 text-right text-green-400 font-medium">₹{pay.amount.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
                            <button onClick={() => setShowDetailModal(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== PAYMENT MODAL ========== */}
            {showPaymentModal && selectedPurchase && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-white/10 p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Record Payment</h3>
                        <p className="text-gray-400 text-sm mb-6">Recording payment for bill dated {new Date(selectedPurchase.orderDate).toLocaleDateString()}</p>

                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Total Bill:</span>
                                    <span className="text-white font-medium">₹{selectedPurchase.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Remaining Balance:</span>
                                    <span className="text-red-400 font-bold">₹{(selectedPurchase.totalAmount - selectedPurchase.amountPaid).toFixed(2)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Amount to Pay (₹)</label>
                                <input type="number" step="0.01" required value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value) || '')} max={selectedPurchase.totalAmount - selectedPurchase.amountPaid} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Payment Date</label>
                                    <input type="date" required value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Mode</label>
                                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm">
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Reference / Note</label>
                                <input type="text" placeholder="e.g. Cheque No, Transaction ID" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl transition-colors font-medium">Cancel</button>
                                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl transition-colors font-medium">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
