import { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-toastify';

function SortableItem({ id, categoryName }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-lg shadow-md flex items-center justify-between border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
    >
      <span className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-100 flex-1">
        {categoryName}
      </span>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <i className="bx bx-menu text-2xl md:text-3xl text-gray-500"></i>
      </div>
    </li>
  );
}

function IconEditItem({ categoryName, iconUrl, onEditStart, onSave, onRemove, editingCategory, inputValue, setInputValue }) {
  return (
    <li className="bg-white dark:bg-gray-800 p-4 md:p-5 rounded-lg shadow-md flex flex-col md:flex-row items-start md:items-center justify-between border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200 gap-4">
      <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={`${categoryName} icon`}
            className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-lg"
            onError={(e) => (e.target.src = 'https://via.placeholder.com/48?text=Icon')}
          />
        ) : (
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <i className="bx bx-image text-lg md:text-xl text-gray-400"></i>
          </div>
        )}
        <span className="text-base md:text-lg font-medium text-gray-800 dark:text-gray-100">
          {categoryName}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
        {editingCategory === categoryName ? (
          <>
            <input
              type="url"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="https://example.com/icon.png"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
              autoFocus
            />
            <div className="flex gap-2 mt-2 md:mt-0">
              <button onClick={onSave} className="text-green-600 hover:text-green-800">
                <i className="bx bx-check text-xl md:text-2xl"></i>
              </button>
              <button onClick={() => onEditStart(null)} className="text-red-600 hover:text-red-800">
                <i className="bx bx-x text-xl md:text-2xl"></i>
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onEditStart(categoryName)}
              className="text-blue-600 hover:text-blue-800"
              title="Add/Edit icon"
            >
              <i className="bx bx-image-alt text-xl md:text-2xl"></i>
            </button>
            {iconUrl && (
              <button
                onClick={() => onRemove(categoryName)}
                className="text-red-600 hover:text-red-800"
                title="Remove icon"
              >
                <i className="bx bx-trash text-xl md:text-2xl"></i>
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function AdminSortCategory() {
  const [categories, setCategories] = useState([]);
  const [orderedCategories, setOrderedCategories] = useState([]);
  const [icons, setIcons] = useState({}); // { category: "https://..." }
  const [editingIcon, setEditingIcon] = useState(null);
  const [iconInput, setIconInput] = useState('');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), async (snapshot) => {
      const catList = snapshot.docs.map((doc) => doc.id);

      try {
        const [orderRef, iconRef] = [
          doc(db, 'settings', 'categoryOrder'),
          doc(db, 'settings', 'categoryIcons')
        ];
        const [orderSnap, iconSnap] = await Promise.all([getDoc(orderRef), getDoc(iconRef)]);

        let ordered = catList;
        if (orderSnap.exists() && orderSnap.data().order) {
          const saved = orderSnap.data().order;
          ordered = [
            ...saved.filter((c) => catList.includes(c)),
            ...catList.filter((c) => !saved.includes(c)).sort((a, b) => a.localeCompare(b)),
          ];
        } else {
          ordered.sort((a, b) => a.localeCompare(b));
        }

        const iconData = iconSnap.exists() ? iconSnap.data().icons || {} : {};

        setCategories(catList);
        setOrderedCategories(ordered);
        setIcons(iconData);
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load categories or icons');
        setOrderedCategories(catList.sort((a, b) => a.localeCompare(b)));
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setOrderedCategories((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveOrder = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'categoryOrder'), { order: orderedCategories });
      toast.success('Category order saved!');
    } catch (err) {
      toast.error('Failed to save order');
    } finally {
      setLoading(false);
    }
  };

  const sortAlphabetically = async () => {
    const sorted = [...categories].sort((a, b) => a.localeCompare(b));
    setOrderedCategories(sorted);
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'categoryOrder'), { order: sorted });
      toast.success('Categories sorted A→Z and saved!');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  // Icon functions
  const startEditingIcon = (category) => {
    setEditingIcon(category);
    setIconInput(icons[category] || '');
  };

  const saveIcon = async () => {
    if (!editingIcon) return;
    const updated = { ...icons, [editingIcon]: iconInput.trim() || null };
    Object.keys(updated).forEach((k) => !updated[k] && delete updated[k]);
    try {
      await setDoc(doc(db, 'settings', 'categoryIcons'), { icons: updated });
      setIcons(updated);
      toast.success('Icon saved!');
      setEditingIcon(null);
      setIconInput('');
    } catch (err) {
      toast.error('Failed to save icon');
    }
  };

  const removeIcon = async (category) => {
    const updated = { ...icons };
    delete updated[category];
    try {
      await setDoc(doc(db, 'settings', 'categoryIcons'), { icons: updated });
      setIcons(updated);
      toast.success('Icon removed');
    } catch (err) {
      toast.error('Failed to remove icon');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <i className="bx bx-loader bx-spin text-3xl text-blue-600"></i>
        <p className="mt-4 text-gray-600">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-7xl mx-auto space-y-12">
      {/* Section 1: Sorting */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
          <i className="bx bx-sort-alt-2 text-blue-600"></i>
          Sort Categories
        </h2>

        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={saveOrder}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 text-white text-sm rounded-xl hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
          >
            <i className="bx bx-save"></i>
            Save Order
          </button>
          <button
            onClick={sortAlphabetically}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <i className="bx bx-sort-a-z"></i>
            Sort A→Z
          </button>
        </div>

        {orderedCategories.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No categories found. Add some first.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedCategories} strategy={verticalListSortingStrategy}>
              <ul className="space-y-4">
                {orderedCategories.map((category) => (
                  <SortableItem
                    key={category}
                    id={category}
                    categoryName={category}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Section 2: Update Icons */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
          <i className="bx bx-image-alt text-green-600"></i>
          Update Category Icons (for Grid Display)
        </h2>

        {categories.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No categories found.</p>
        ) : (
          <ul className="space-y-4">
            {orderedCategories.map((category) => (
              <IconEditItem
                key={category}
                categoryName={category}
                iconUrl={icons[category]}
                onEditStart={startEditingIcon}
                onSave={saveIcon}
                onRemove={removeIcon}
                editingCategory={editingIcon}
                inputValue={iconInput}
                setInputValue={setIconInput}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}