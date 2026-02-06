"use client";

export default function SectionDivider({ type = "lemma", number = "1", text, className = "" }) {
    // Type can be: 'lemma', 'theorem', 'qed', 'axiom', 'generic'

    return (
        <div className={`flex items-center gap-4 justify-center my-12 ${className}`}>

            {type === "qed" ? (
                <>
                    <div className="h-[1px] w-24 bg-gradient-to-l from-white/30 to-transparent" />
                    <span className="font-serif italic text-white/50 text-xl tracking-widest">Q.E.D.</span>
                    <div className="h-[1px] w-24 bg-gradient-to-r from-white/30 to-transparent" />
                </>
            ) : (
                <>
                    <span className="font-serif italic text-teal text-xl tracking-wide lowercase first-letter:uppercase">
                        {text ? text : `${type} ${number}.`}
                    </span>
                    <div className="h-[1px] flex-1 max-w-4xl bg-gradient-to-r from-teal/50 to-transparent" />
                </>
            )}

        </div>
    );
}
