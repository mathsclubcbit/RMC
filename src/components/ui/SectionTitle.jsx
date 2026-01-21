export default function SectionTitle({ title, subtitle, center = true, gradient = false, variant = "default" }) {
    // Determine the text class
    let textClass = "text-foreground";

    if (gradient) {
        textClass = "text-gradient";
    } else if (variant === "primary") {
        textClass = "text-gradient";
    } else if (variant === "gold") {
        textClass = "text-gradient-gold";
    } else if (variant === "silver") {
        textClass = "text-gradient-silver";
    }

    return (
        <div className={`mb-16 ${center ? "text-center" : ""}`}>
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 font-serif tracking-tight pb-2 ${textClass}`}>
                {title}
            </h2>
            {subtitle && (
                <div className="flex flex-col items-center gap-4">
                    {/* Decorative Separator */}
                    <div className="flex items-center gap-2 text-teal/40 font-mono text-xs">
                        <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-teal/40"></span>
                        <span>//</span>
                        <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-teal/40"></span>
                    </div>

                    <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed font-sans">
                        {subtitle}
                    </p>
                </div>
            )}
        </div>
    );
}
