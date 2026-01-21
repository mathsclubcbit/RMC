"use client";

export default function MathSymbols() {
    const symbols = [
        { symbol: "∑", className: "math-symbol-1", top: "15%", left: "10%" },
        { symbol: "π", className: "math-symbol-2", top: "25%", right: "15%" },
        { symbol: "∫", className: "math-symbol-3", top: "65%", left: "15%" },
        { symbol: "ζ", className: "math-symbol-4", top: "75%", right: "10%" },
        { symbol: "∞", className: "math-symbol-1", top: "45%", left: "5%" },
        { symbol: "√", className: "math-symbol-2", top: "85%", right: "20%" },
        { symbol: "Δ", className: "math-symbol-3", top: "10%", left: "85%" },
        { symbol: "θ", className: "math-symbol-4", top: "55%", right: "5%" },
        { symbol: "λ", className: "math-symbol-1", top: "90%", left: "25%" },
        { symbol: "φ", className: "math-symbol-2", top: "35%", left: "90%" },
    ];

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {symbols.map((item, index) => (
                <span
                    key={index}
                    className={`math-symbol ${item.className} absolute`}
                    style={{
                        top: item.top,
                        left: item.left,
                        right: item.right,
                    }}
                >
                    {item.symbol}
                </span>
            ))}
        </div>
    );
}
