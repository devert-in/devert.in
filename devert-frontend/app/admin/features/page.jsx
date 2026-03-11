"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Wifi, WifiOff } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const DEFAULT_LINKS = [
    { id: "0", name: "COMMUNITY", href: "/community", type: "internal", visible: true, online: true },
    { id: "1", name: "BUILD SPRINT", href: "/sprints", type: "internal", visible: true, online: true },
    { id: "2", name: "CONTESTS", href: "/contests", type: "internal", visible: true, online: true },
    { id: "3", name: "AGENT GARAGE", href: "/garage", type: "internal", visible: true, online: true },
    { id: "4", name: "AGENT DEPLOYMENTS", href: "/deployments", type: "internal", visible: true, online: true },
    { id: "5", name: "AGENT SHOWCASE", href: "/showcase", type: "internal", visible: true, online: true },
    { id: "6", name: "PROMPT LAB", href: "/prompt-lab", type: "internal", visible: true, online: true },
];

export default function FeaturesManager() {
    const [items, setItems] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ name: "", href: "", type: "internal" });
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "system", "navigation"), (doc) => {
            if (doc.exists() && doc.data().items) {
                setItems(doc.data().items);
            } else {
                setItems(DEFAULT_LINKS);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const reorderedItems = Array.from(items);
        const [removed] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, removed);
        setItems(reorderedItems);
        saveOrder(reorderedItems);
    };

    const saveOrder = async (newItems) => {
        try {
            await setDoc(doc(db, "system", "navigation"), { items: newItems }, { merge: true });
        } catch (error) {
            console.error("Failed to save order", error);
        }
    };

    if (!enabled) {
        return null; // Prevent hydration mismatch
    }

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.href) return;

        const itemToAdd = {
            id: Date.now().toString(),
            name: newItem.name.toUpperCase(),
            href: newItem.href,
            type: newItem.type,
            external: newItem.type === 'external'
        };

        const updatedItems = [...items, itemToAdd];
        await saveOrder(updatedItems);
        setNewItem({ name: "", href: "", type: "internal" });
        setIsAdding(false);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to remove this navigation item?")) {
            const updatedItems = items.filter(item => item.id !== id);
            await saveOrder(updatedItems);
        }
    };

    const toggleHideOnHome = async (id) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                return { ...item, hideOnHome: !item.hideOnHome };
            }
            return item;
        });
        await saveOrder(updatedItems);
    };

    const toggleVisibility = async (id) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                return { ...item, visible: item.visible === false ? true : false };
            }
            return item;
        });
        await saveOrder(updatedItems);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-sans text-white">SYSTEM_NAVIGATION</h1>
                    <p className="text-gray-400 font-mono text-sm mt-2">Manage Navbar items and features.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-neon-cyan text-black px-4 py-2 font-bold font-mono text-sm rounded hover:bg-white transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> ADD_FEATURE
                </button>
            </div>

            {/* Add Item Form */}
            {isAdding && (
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg mb-8 animate-in slide-in-from-top-4">
                    <h3 className="font-bold font-sans text-neon-cyan mb-4">CONFIGURE_NEW_FEATURE</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-mono text-gray-500 block mb-1">FEATURE NAME</label>
                            <input
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="e.g. MERCH STORE"
                                className="w-full bg-black border border-white/20 p-2 text-white font-mono text-sm rounded"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-mono text-gray-500 block mb-1">FEATURE TYPE</label>
                            <select
                                value={newItem.type}
                                onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                className="w-full bg-black border border-white/20 p-2 text-white font-mono text-sm rounded"
                            >
                                <option value="internal">Internal Route (Page)</option>
                                <option value="external">External Link (New Tab)</option>
                                <option value="placeholder">Coming Soon (Disabled)</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-xs font-mono text-gray-500 block mb-1">DESTINATION PATH / URL</label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-mono text-sm">{newItem.type === 'external' ? 'https://' : 'devert.in/'}</span>
                            <input
                                value={newItem.href}
                                onChange={(e) => setNewItem({ ...newItem, href: e.target.value })}
                                placeholder={newItem.type === 'external' ? "google.com" : "new-page"}
                                className="flex-1 bg-black border border-white/20 p-2 text-white font-mono text-sm rounded"
                            />
                        </div>
                        {newItem.type === 'internal' && (
                            <p className="text-[10px] text-gray-500 mt-1 font-mono">
                                * Note: Ensure this route exists or is handled by the module system.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 font-mono text-xs text-red-400 hover:text-red-300"
                        >
                            CANCEL
                        </button>
                        <button
                            onClick={handleAddItem}
                            className="bg-neon-green text-black px-4 py-2 font-bold font-mono text-xs rounded hover:bg-white"
                        >
                            DEPLOY_FEATURE
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-white/10 grid grid-cols-12 text-xs font-mono text-gray-500 bg-white/5">
                    <div className="col-span-1">ORDER</div>
                    <div className="col-span-4">NAME</div>
                    <div className="col-span-4">PATH</div>
                    <div className="col-span-3 text-right">ACTIONS</div>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="nav-items">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {items.map((item, index) => (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="grid grid-cols-12 p-4 border-b border-white/5 bg-black hover:bg-white/5 items-center group"
                                            >
                                                <div className="col-span-1" {...provided.dragHandleProps}>
                                                    <GripVertical size={16} className="text-gray-600 hover:text-white cursor-grab" />
                                                </div>
                                                <div className="col-span-4 font-bold font-sans text-white flex items-center gap-2">
                                                    {item.name}
                                                    {item.type === 'external' && <LinkIcon size={10} className="text-gray-500" />}
                                                    {item.type === 'placeholder' && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1 rounded">SOON</span>}
                                                    {item.hideOnHome && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1 rounded border border-blue-500/20">NO_HOME</span>}
                                                    {item.visible === false && <span className="text-[10px] bg-red-500/10 text-red-500 px-1 rounded border border-red-500/20">HIDDEN</span>}
                                                </div>
                                                <div className="col-span-4 font-mono text-xs text-gray-400 truncate">
                                                    {item.href}
                                                </div>
                                                <div className="col-span-3 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => toggleHideOnHome(item.id)}
                                                        className={`p-1 rounded hover:bg-white/10 ${item.hideOnHome ? 'text-blue-500' : 'text-gray-600'}`}
                                                        title="Toggle Hide on Home"
                                                    >
                                                        {item.hideOnHome ? <WifiOff size={14} /> : <Wifi size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => toggleVisibility(item.id)}
                                                        className={`p-1 rounded hover:bg-white/10 ${item.visible === false ? 'text-gray-600' : 'text-green-500'}`}
                                                        title="Toggle Visibility"
                                                    >
                                                        {item.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    );
}
