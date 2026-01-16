import React from 'react';
import { Trash2, Clock, Settings, Sliders } from 'lucide-react';
import { useDashboard } from '../../src/features/dashboard/context/DashboardContext';
import { usePermissions } from '../shared/hooks/usePermissions';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Swal from 'sweetalert2';

const BaseWidget = ({ id, title, icon: Icon, lastUpdated, children, onEdit, onCustomize }) => {
    const { isEditMode, removeWidget } = useDashboard();
    const { can } = usePermissions();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id, disabled: !can.editDashboard });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative'
    };

    const handleDelete = async (e) => {
        e.stopPropagation();

        const result = await Swal.fire({
            title: 'Delete Widget?',
            html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">This action cannot be undone.</p>
          <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mt-3 text-sm">
            <p><strong>Widget:</strong> ${title}</p>
            <p class="text-xs text-slate-500 mt-1">All widget data and configuration will be permanently deleted.</p>
          </div>
        </div>
      `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            removeWidget(id);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border transition-all relative group h-full flex flex-col ${isEditMode && can.editDashboard
                    ? 'border-orange-300 ring-2 ring-orange-100 dark:border-orange-700 dark:ring-orange-900/30'
                    : 'border-slate-100 dark:border-slate-700 hover:shadow-md'
                }`}
        >

            <div className="flex justify-between items-center p-5 pb-2 relative z-20">
                <div className="flex items-center gap-2 overflow-hidden">
                    {Icon && (
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                            <Icon size={16} />
                        </div>
                    )}
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{title}</h3> </div>    {isEditMode && can.editDashboard && (
                        <div className="flex items-center gap-2">
                            {onCustomize && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCustomize();
                                    }}
                                    className="p-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
                                    title="Advanced Customization"
                                >
                                    <Sliders size={16} />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit && onEdit();
                                }}
                                className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                                title="Edit Widget"
                            >
                                <Settings size={16} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                                title="Delete Widget"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
            </div>  <div className="flex-1 px-5 relative z-10">
                {children}
            </div>  <div className="px-5 py-3 mt-2 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{lastUpdated ? `Updated: ${lastUpdated}` : 'Waiting for data...'}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${lastUpdated ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            </div>  {isEditMode && can.editDashboard && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 hover:bg-white/10 dark:hover:bg-slate-800/10 cursor-grab active:cursor-grabbing rounded-2xl z-10"
                />
            )}
        </div>
    );
}; export default BaseWidget;