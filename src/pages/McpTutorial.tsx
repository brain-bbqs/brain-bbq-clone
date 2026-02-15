import { useState } from "react";
import { Link } from "react-router-dom";
import { Terminal, BookOpen, ChevronRight, ArrowRight, Globe, Settings, Play, Package, Code, FileCode, Plug, Zap, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/api-docs/CodeBlock";
import { StepCard } from "@/components/api-docs/StepCard";
import { Badge } from "@/components/ui/badge";

const installCode = `pip install mcp`;

const basicServerCode = `# server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-neuro-tools")

@mcp.tool()
def search_neurons(species: str, brain_region: str = "") -> str:
    """Search for neuron types by species and optional brain region."""
    # Your existing Python logic here
    from my_package import neuron_db
    results = neuron_db.search(species=species, region=brain_region)
    return f"Found {len(results)} neurons: " + ", ".join(r.name for r in results)

@mcp.tool()
def get_connectivity(neuron_id: str) -> str:
    """Get synaptic connectivity for a specific neuron."""
    from my_package import connectivity
    data = connectivity.get(neuron_id)
    return str(data)

if __name__ == "__main__":
    mcp.run(transport="streamable-http", host="0.0.0.0", port=8000)`;

const wrapExistingCode = `# Wrapping an existing Python package as MCP tools
from mcp.server.fastmcp import FastMCP
from my_analysis_package import PoseEstimator, BehaviorClassifier

mcp = FastMCP("behavior-analysis-mcp")

# Wrap your existing class methods as MCP tools
estimator = PoseEstimator()
classifier = BehaviorClassifier()

@mcp.tool()
def estimate_pose(video_path: str, model: str = "hrnet") -> str:
    """Run pose estimation on a video file.
    
    Args:
        video_path: Path or URL to the video file
        model: Model to use (hrnet, dlc, sleap)
    """
    result = estimator.run(video_path, model=model)
    return result.to_json()

@mcp.tool()
def classify_behavior(
    keypoints_path: str, 
    species: str,
    min_confidence: float = 0.8
) -> str:
    """Classify behavioral syllables from pose keypoints.
    
    Args:
        keypoints_path: Path to keypoints CSV/JSON
        species: Species name for model selection
        min_confidence: Minimum confidence threshold
    """
    behaviors = classifier.predict(keypoints_path, species, min_confidence)
    return str(behaviors)`;

const dockerfileCode = `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY server.py .
EXPOSE 8000
CMD ["python", "server.py"]`;

const requirementsCode = `mcp>=1.0.0
my-analysis-package>=0.5.0`;

const testCode = `# Test your MCP server locally
# Terminal 1: Start the server
python server.py

# Terminal 2: Test with MCP Inspector
npx @modelcontextprotocol/inspector

# In the Inspector UI:
# 1. Select "Streamable HTTP" transport
# 2. Enter: http://localhost:8000/mcp
# 3. Click Connect
# 4. Click "List Tools" to see your tools
# 5. Test each tool with sample inputs`;

const deployOptions = `# Option 1: Deploy to any cloud VM / VPS
ssh myserver
docker build -t my-mcp-server .
docker run -d -p 8000:8000 my-mcp-server

# Option 2: Deploy to Railway / Render / Fly.io
# Just push your Dockerfile — they auto-detect and deploy

# Option 3: Deploy to AWS Lambda (with adapter)
pip install mangum
# See: https://github.com/modelcontextprotocol/servers`;

const registrationExample = `# After deploying, your MCP server URL will be:
# https://your-server.example.com/mcp

# Users can add it to Claude Desktop:
{
  "mcpServers": {
    "my-neuro-tools": {
      "url": "https://your-server.example.com/mcp"
    }
  }
}`;

export default function McpTutorial() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(280_60%_25%)] via-[hsl(270_50%_20%)] to-[hsl(260_45%_18%)] p-8 sm:p-10 text-[hsl(0_0%_100%)]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[hsl(38_90%_50%/0.15)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[hsl(280_60%_60%/0.15)] rounded-full blur-3xl translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[hsl(38_90%_50%)] flex items-center justify-center">
              <Package className="h-6 w-6 text-[hsl(222_47%_15%)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Build Your Own MCP Server</h1>
              <p className="text-[hsl(280_60%_80%)] text-sm">Python → MCP in 5 minutes</p>
            </div>
          </div>
          <p className="text-[hsl(280_60%_85%)] text-sm sm:text-base max-w-2xl leading-relaxed">
            Turn any Python package into an MCP server that AI agents can use natively. This guide walks you through wrapping your existing code, deploying it, and registering it with the BBQS ecosystem.
          </p>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Code, title: "Wrap Your Code", desc: "Decorate existing Python functions with @mcp.tool() to expose them as MCP tools.", gradient: "from-[hsl(280_60%_50%/0.1)] to-transparent", iconBg: "bg-[hsl(280_60%_50%)]" },
          { icon: Globe, title: "Deploy Anywhere", desc: "Run on any server, Docker container, or serverless platform with HTTP support.", gradient: "from-[hsl(38_90%_50%/0.1)] to-transparent", iconBg: "bg-[hsl(38_90%_50%)]" },
          { icon: Plug, title: "Register with BBQS", desc: "Submit your MCP server to the BBQS community registry so others can discover it.", gradient: "from-[hsl(150_60%_40%/0.1)] to-transparent", iconBg: "bg-[hsl(150_60%_40%)]" },
        ].map((card) => (
          <div key={card.title} className={cn("border border-border rounded-xl p-5 bg-gradient-to-br", card.gradient)}>
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", card.iconBg)}>
              <card.icon className="h-4 w-4 text-[hsl(0_0%_100%)]" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Prerequisites */}
      <div className="mb-8 border border-[hsl(280_60%_50%/0.3)] rounded-xl p-5 bg-gradient-to-r from-[hsl(280_60%_50%/0.06)] to-transparent">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(280_60%_50%)] mb-2 flex items-center gap-1.5">
          <Settings className="h-3.5 w-3.5" /> Prerequisites
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 mt-2">
          {["Python 3.10+", "An existing Python package or script you want to expose", "Basic familiarity with decorators and type hints"].map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3 text-[hsl(280_60%_50%)] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Step 1: Install */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[hsl(222_47%_20%)] flex items-center justify-center">
            <span className="text-sm font-bold text-[hsl(0_0%_100%)]">1</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Install the MCP SDK</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-11 mb-4">The official Python SDK provides the <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">FastMCP</code> class for building servers with minimal boilerplate.</p>
        <div className="ml-11">
          <CodeBlock code={installCode} />
        </div>
      </div>

      {/* Step 2: Basic Server */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[hsl(38_90%_50%)] flex items-center justify-center">
            <span className="text-sm font-bold text-[hsl(222_47%_15%)]">2</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Create a Basic MCP Server</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-11 mb-4">
          Use the <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">@mcp.tool()</code> decorator to expose any Python function as an MCP tool. The function's docstring becomes the tool description, and type hints define the parameter schema.
        </p>
        <div className="ml-11">
          <CodeBlock code={basicServerCode} language="python" />
        </div>
        <div className="ml-11 mt-3 border border-[hsl(38_90%_50%/0.3)] rounded-lg p-3 bg-[hsl(38_90%_50%/0.05)]">
          <p className="text-xs text-muted-foreground">
            <span className="text-[hsl(38_90%_50%)] font-semibold">💡 Tip:</span> The MCP SDK auto-generates JSON Schema from your type hints. Use descriptive parameter names and docstrings — AI agents read these to understand how to call your tools.
          </p>
        </div>
      </div>

      {/* Step 3: Wrap Existing Package */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[hsl(150_60%_40%)] flex items-center justify-center">
            <span className="text-sm font-bold text-[hsl(0_0%_100%)]">3</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Wrap an Existing Package</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-11 mb-4">
          Already have a Python package? Import it and wrap key methods as MCP tools. You don't need to modify your existing code at all.
        </p>
        <div className="ml-11">
          <CodeBlock code={wrapExistingCode} language="python" />
        </div>
        <div className="ml-11 mt-3 border border-[hsl(150_60%_40%/0.3)] rounded-lg p-3 bg-[hsl(150_60%_40%/0.05)]">
          <p className="text-xs text-muted-foreground">
            <span className="text-[hsl(150_60%_40%)] font-semibold">💡 Best practice:</span> Return structured text (JSON strings) from your tools. MCP tools return text content, so serialize complex results. Keep tool descriptions concise but specific about what they do.
          </p>
        </div>
      </div>

      {/* Step 4: Test Locally */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[hsl(0_70%_50%)] flex items-center justify-center">
            <span className="text-sm font-bold text-[hsl(0_0%_100%)]">4</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Test Locally</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-11 mb-4">
          Run your server locally and use the MCP Inspector to verify all tools are discovered and working correctly.
        </p>
        <div className="ml-11">
          <CodeBlock code={testCode} />
        </div>
      </div>

      {/* Step 5: Deploy */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[hsl(220_80%_55%)] flex items-center justify-center">
            <span className="text-sm font-bold text-[hsl(0_0%_100%)]">5</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Deploy</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-11 mb-4">
          Package your server with Docker and deploy to any hosting provider. The MCP server is just an HTTP endpoint.
        </p>

        <div className="ml-11 space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <FileCode className="h-3 w-3" /> Dockerfile
            </h4>
            <CodeBlock code={dockerfileCode} language="docker" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <FileCode className="h-3 w-3" /> requirements.txt
            </h4>
            <CodeBlock code={requirementsCode} />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Terminal className="h-3 w-3" /> Deploy Options
            </h4>
            <CodeBlock code={deployOptions} />
          </div>
        </div>
      </div>

      {/* Step 6: Register */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[hsl(280_60%_50%)] flex items-center justify-center">
            <span className="text-sm font-bold text-[hsl(0_0%_100%)]">6</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Register with BBQS</h2>
        </div>
        <p className="text-sm text-muted-foreground ml-11 mb-4">
          Once deployed, users can connect directly. To make your server discoverable in the BBQS ecosystem, submit it to our community registry.
        </p>
        <div className="ml-11 mb-4">
          <CodeBlock code={registrationExample} language="json" />
        </div>
        <div className="ml-11">
          <Link
            to="/mcp-registry"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[hsl(280_60%_50%)] text-[hsl(0_0%_100%)] text-sm font-semibold hover:bg-[hsl(280_60%_55%)] transition-colors"
          >
            <Plug className="h-4 w-4" />
            Submit to BBQS MCP Registry
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Resources */}
      <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-card to-muted/30 mb-10">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[hsl(38_90%_50%)]" />
          Resources
        </h3>
        <ul className="text-xs text-muted-foreground space-y-2">
          {[
            { text: "MCP Python SDK Documentation", url: "https://modelcontextprotocol.io/quickstart/server" },
            { text: "MCP Specification", url: "https://spec.modelcontextprotocol.io" },
            { text: "Example MCP Servers (GitHub)", url: "https://github.com/modelcontextprotocol/servers" },
            { text: "MCP Inspector Tool", url: "https://github.com/modelcontextprotocol/inspector" },
          ].map((resource, i) => (
            <li key={i}>
              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <ExternalLink className="h-3 w-3 text-[hsl(38_90%_50%)] shrink-0" />
                <span>{resource.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Cross-links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/mcp-docs"
          className="block border border-[hsl(150_60%_40%/0.2)] rounded-xl p-4 bg-gradient-to-r from-[hsl(150_60%_40%/0.06)] to-transparent hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[hsl(150_60%_40%)] flex items-center justify-center">
              <Plug className="h-4 w-4 text-[hsl(0_0%_100%)]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">BBQS MCP Server</h4>
              <p className="text-xs text-muted-foreground">Connect to the official BBQS MCP →</p>
            </div>
          </div>
        </Link>
        <Link
          to="/mcp-registry"
          className="block border border-[hsl(280_60%_50%/0.2)] rounded-xl p-4 bg-gradient-to-r from-[hsl(280_60%_50%/0.06)] to-transparent hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[hsl(280_60%_50%)] flex items-center justify-center">
              <Zap className="h-4 w-4 text-[hsl(0_0%_100%)]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Community Registry</h4>
              <p className="text-xs text-muted-foreground">Browse & submit MCP servers →</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
