import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Mail } from "lucide-react";

interface PI {
  name: string;
  email: string;
  isContact?: boolean;
}

interface ProjectCardProps {
  grantNumber: string;
  title: string;
  link: string;
  pis: PI[];
  institutions: string;
  description: string;
  youtubeId?: string;
}

const ProjectCard = ({
  grantNumber,
  title,
  link,
  pis,
  institutions,
  description,
  youtubeId,
}: ProjectCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-card/50 transition-colors">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <span className="font-semibold text-primary">{grantNumber}</span>
          <span className="text-muted-foreground">-</span>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary hover:underline inline-flex items-center gap-1"
          >
            {title}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="text-sm">
          <span className="font-semibold text-muted-foreground">PI(s)</span> -{" "}
          {pis.map((pi, index) => (
            <span key={pi.email}>
              <a
                href={`mailto:${pi.email}`}
                className="text-foreground hover:text-primary hover:underline inline-flex items-center gap-0.5"
              >
                {pi.name}
                {pi.isContact && "*"}
              </a>
              {index < pis.length - 1 && ", "}
            </span>
          ))}
        </div>

        <div className="text-sm">
          <span className="font-semibold text-muted-foreground">Institution(s)</span> -{" "}
          <span className="text-foreground">{institutions}</span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors mt-2"
        >
          {isOpen ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show details
            </>
          )}
        </button>

        {isOpen && (
          <div className="mt-3 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
            {youtubeId && (
              <div className="aspect-video w-full max-w-xl">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Project video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
