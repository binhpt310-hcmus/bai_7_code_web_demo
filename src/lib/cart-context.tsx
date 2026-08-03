"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

export interface CartLine {
  menuItemId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  note: string;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  hydrated: boolean;
}

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: Omit<CartLine, "quantity" | "note">; quantity: number; note: string }
  | { type: "setQuantity"; menuItemId: string; quantity: number }
  | { type: "setNote"; menuItemId: string; note: string }
  | { type: "remove"; menuItemId: string }
  | { type: "clear" }
  | { type: "open" }
  | { type: "close" };

const STORAGE_KEY = "rang-moc-cart-v1";

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "hydrate":
      return { ...state, lines: action.lines, hydrated: true };
    case "add": {
      const existing = state.lines.find((l) => l.menuItemId === action.line.menuItemId);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.menuItemId === action.line.menuItemId
              ? { ...l, quantity: l.quantity + action.quantity }
              : l
          ),
          isOpen: true,
        };
      }
      return {
        ...state,
        lines: [
          ...state.lines,
          { ...action.line, quantity: action.quantity, note: action.note },
        ],
        isOpen: true,
      };
    }
    case "setQuantity":
      if (action.quantity <= 0) {
        return { ...state, lines: state.lines.filter((l) => l.menuItemId !== action.menuItemId) };
      }
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.menuItemId === action.menuItemId ? { ...l, quantity: action.quantity } : l
        ),
      };
    case "setNote":
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.menuItemId === action.menuItemId ? { ...l, note: action.note } : l
        ),
      };
    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.menuItemId !== action.menuItemId) };
    case "clear":
      return { ...state, lines: [] };
    case "open":
      return { ...state, isOpen: true };
    case "close":
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

interface CartContextValue {
  lines: CartLine[];
  isOpen: boolean;
  totalQuantity: number;
  totalAmount: number;
  addItem: (line: Omit<CartLine, "quantity" | "note">, quantity?: number, note?: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  setNote: (menuItemId: string, note: string) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    lines: [],
    isOpen: false,
    hydrated: false,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      dispatch({ type: "hydrate", lines: raw ? JSON.parse(raw) : [] });
    } catch {
      dispatch({ type: "hydrate", lines: [] });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
  }, [state.lines, state.hydrated]);

  const addItem = useCallback(
    (line: Omit<CartLine, "quantity" | "note">, quantity = 1, note = "") => {
      dispatch({ type: "add", line, quantity, note });
    },
    []
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      isOpen: state.isOpen,
      totalQuantity: state.lines.reduce((sum, l) => sum + l.quantity, 0),
      totalAmount: state.lines.reduce((sum, l) => sum + l.quantity * l.price, 0),
      addItem,
      setQuantity: (menuItemId, quantity) => dispatch({ type: "setQuantity", menuItemId, quantity }),
      setNote: (menuItemId, note) => dispatch({ type: "setNote", menuItemId, note }),
      removeItem: (menuItemId) => dispatch({ type: "remove", menuItemId }),
      clear: () => dispatch({ type: "clear" }),
      open: () => dispatch({ type: "open" }),
      close: () => dispatch({ type: "close" }),
    }),
    [state, addItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
