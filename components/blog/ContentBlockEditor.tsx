import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { ContentBlock, AVAILABLE_ICONS } from "./types/BlockTypes";
import * as LucideIcons from "lucide-react";

interface ContentBlockEditorProps {
  block: ContentBlock;
  onChange: (block: ContentBlock) => void;
}

export function ContentBlockEditor({ block, onChange }: ContentBlockEditorProps) {
  const updateBlock = (updates: any) => {
    onChange({ ...block, ...updates } as ContentBlock);
  };

  // Function to render an icon by name
  const renderIcon = (iconName: string, className: string = "w-4 h-4") => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return null;
  };

  const addArrayItem = (field: string, item: string) => {
    const currentArray = (block as any)[field] || [];
    updateBlock({ [field]: [...currentArray, item] });
  };

  const removeArrayItem = (field: string, index: number) => {
    const currentArray = (block as any)[field] || [];
    const newArray = currentArray.filter((_: any, i: number) => i !== index);
    updateBlock({ [field]: newArray });
  };

  const updateArrayItem = (field: string, index: number, value: string) => {
    const currentArray = (block as any)[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    updateBlock({ [field]: newArray });
  };

  const updateRequirement = (index: number, field: string, value: string) => {
    const currentRequirements = (block as any).requirements || [];
    const newRequirements = [...currentRequirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    updateBlock({ requirements: newRequirements });
  };

  const addRequirement = () => {
    const currentRequirements = (block as any).requirements || [];
    const newRequirement = {
      title: "New Requirement",
      description: "Requirement description",
      icon: "CheckCircle",
    };
    updateBlock({ requirements: [...currentRequirements, newRequirement] });
  };

  const removeRequirement = (index: number) => {
    const currentRequirements = (block as any).requirements || [];
    const newRequirements = currentRequirements.filter((_: any, i: number) => i !== index);
    updateBlock({ requirements: newRequirements });
  };

  const updateFeature = (index: number, field: string, value: any) => {
    const currentFeatures = (block as any).features || [];
    const newFeatures = [...currentFeatures];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    updateBlock({ features: newFeatures });
  };

  const addFeature = () => {
    const currentFeatures = (block as any).features || [];
    const newFeature = {
      title: "New Feature",
      description: "Feature description",
      icon: "Star",
      color: "purple",
    };
    updateBlock({ features: [...currentFeatures, newFeature] });
  };

  const removeFeature = (index: number) => {
    const currentFeatures = (block as any).features || [];
    const newFeatures = currentFeatures.filter((_: any, i: number) => i !== index);
    updateBlock({ features: newFeatures });
  };

  const updateFeatureTip = (featureIndex: number, tipIndex: number, value: string) => {
    const currentFeatures = (block as any).features || [];
    const newFeatures = [...currentFeatures];
    const currentTips = newFeatures[featureIndex].tips || [];
    const newTips = [...currentTips];
    newTips[tipIndex] = value;
    newFeatures[featureIndex] = { ...newFeatures[featureIndex], tips: newTips };
    updateBlock({ features: newFeatures });
  };

  const addFeatureTip = (featureIndex: number) => {
    const currentFeatures = (block as any).features || [];
    const newFeatures = [...currentFeatures];
    const currentTips = newFeatures[featureIndex].tips || [];
    newFeatures[featureIndex] = { ...newFeatures[featureIndex], tips: [...currentTips, ""] };
    updateBlock({ features: newFeatures });
  };

  const removeFeatureTip = (featureIndex: number, tipIndex: number) => {
    const currentFeatures = (block as any).features || [];
    const newFeatures = [...currentFeatures];
    const currentTips = newFeatures[featureIndex].tips || [];
    const newTips = currentTips.filter((_: any, i: number) => i !== tipIndex);
    newFeatures[featureIndex] = { ...newFeatures[featureIndex], tips: newTips };
    updateBlock({ features: newFeatures });
  };

  const renderCardBlock = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={(block as any).title || ""}
            onChange={(e) => updateBlock({ title: e.target.value })}
            placeholder="Card title"
          />
        </div>
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select
            value={(block as any).variant || "feature"}
            onValueChange={(value) => updateBlock({ variant: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="tip">Tip</SelectItem>
              <SelectItem value="alert">Warning/Alert</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
           <Label>Icon</Label>
           <Select
             value={(block as any).icon || "Star"}
             onValueChange={(value) => updateBlock({ icon: value })}
           >
             <SelectTrigger>
               <SelectValue>
                 <div className="flex items-center gap-2">
                   {renderIcon((block as any).icon || "Star")}
                   <span>{(block as any).icon || "Star"}</span>
                 </div>
               </SelectValue>
             </SelectTrigger>
             <SelectContent>
               {AVAILABLE_ICONS.map((icon) => (
                 <SelectItem key={icon} value={icon}>
                   <div className="flex items-center gap-2">
                     {renderIcon(icon)}
                     <span>{icon}</span>
                   </div>
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
                 <div className="space-y-2">
           <Label>Color</Label>
           <Select
             value={(block as any).color || "purple"}
             onValueChange={(value) => updateBlock({ color: value })}
           >
             <SelectTrigger>
               <SelectValue>
                 <div className="flex items-center gap-2">
                   <div 
                     className={`w-4 h-4 rounded-full border-2 border-gray-300 ${
                       (block as any).color === "purple" ? "bg-purple-500" :
                       (block as any).color === "blue" ? "bg-blue-500" :
                       (block as any).color === "green" ? "bg-green-500" :
                       (block as any).color === "yellow" ? "bg-yellow-500" :
                       (block as any).color === "red" ? "bg-red-500" :
                       "bg-purple-500"
                     }`}
                   />
                   <span className="capitalize">{(block as any).color || "purple"}</span>
                 </div>
               </SelectValue>
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="purple">
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-gray-300" />
                   <span>Purple</span>
                 </div>
               </SelectItem>
               <SelectItem value="blue">
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-300" />
                   <span>Blue</span>
                 </div>
               </SelectItem>
               <SelectItem value="green">
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-gray-300" />
                   <span>Green</span>
                 </div>
               </SelectItem>
               <SelectItem value="yellow">
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-gray-300" />
                   <span>Yellow</span>
                 </div>
               </SelectItem>
               <SelectItem value="red">
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-gray-300" />
                   <span>Red</span>
                 </div>
               </SelectItem>
             </SelectContent>
           </Select>
         </div>
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={(block as any).content || ""}
          onChange={(e) => updateBlock({ content: e.target.value })}
          placeholder="Card content"
          rows={3}
        />
      </div>

      {/* Show solution field for warning/alert variants */}
      {((block as any).variant === "warning" || (block as any).variant === "alert") && (
        <div className="space-y-2">
          <Label>Solution</Label>
          <Textarea
            value={(block as any).solution || ""}
            onChange={(e) => updateBlock({ solution: e.target.value })}
            placeholder="Provide a solution to the warning..."
            rows={3}
          />
        </div>
      )}

      {/* Link fields */}
      <div className="space-y-2">
        <Label>Link (Optional)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Link Text</Label>
            <Input
              value={(block as any).link?.text || ""}
              onChange={(e) => updateBlock({ 
                link: { 
                  ...(block as any).link, 
                  text: e.target.value 
                } 
              })}
              placeholder="Learn more"
            />
          </div>
          <div className="space-y-2">
            <Label>Link URL</Label>
            <Input
              value={(block as any).link?.url || ""}
              onChange={(e) => updateBlock({ 
                link: { 
                  ...(block as any).link, 
                  url: e.target.value 
                } 
              })}
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepBlock = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Step Number</Label>
          <Input
            type="number"
            value={(block as any).stepNumber || 1}
            onChange={(e) => updateBlock({ stepNumber: parseInt(e.target.value) })}
            min={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Estimated Time</Label>
          <Input
            value={(block as any).estimatedTime || ""}
            onChange={(e) => updateBlock({ estimatedTime: e.target.value })}
            placeholder="e.g., 5 minutes"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={(block as any).title || ""}
          onChange={(e) => updateBlock({ title: e.target.value })}
          placeholder="Step title"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={(block as any).description || ""}
          onChange={(e) => updateBlock({ description: e.target.value })}
          placeholder="Step description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Details</Label>
        {(block as any).details?.map((detail: string, index: number) => (
          <div key={index} className="flex gap-2">
            <Input
              value={detail}
              onChange={(e) => updateArrayItem("details", index, e.target.value)}
              placeholder={`Detail ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeArrayItem("details", index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addArrayItem("details", "")}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Detail
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Tips</Label>
        {(block as any).tips?.map((tip: string, index: number) => (
          <div key={index} className="flex gap-2">
            <Input
              value={tip}
              onChange={(e) => updateArrayItem("tips", index, e.target.value)}
              placeholder={`Tip ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeArrayItem("tips", index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addArrayItem("tips", "")}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Tip
        </Button>
      </div>
    </div>
  );

  const renderAlertBlock = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={(block as any).title || ""}
            onChange={(e) => updateBlock({ title: e.target.value })}
            placeholder="Alert title"
          />
        </div>
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select
            value={(block as any).variant || "info"}
            onValueChange={(value) => updateBlock({ variant: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="note">Note</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <Textarea
          value={(block as any).content || ""}
          onChange={(e) => updateBlock({ content: e.target.value })}
          placeholder="Alert content"
          rows={3}
        />
      </div>
    </div>
  );

  const renderTableBlock = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={(block as any).title || ""}
          onChange={(e) => updateBlock({ title: e.target.value })}
          placeholder="Table title"
        />
      </div>

      <div className="space-y-2">
        <Label>Headers</Label>
        {(block as any).headers?.map((header: string, index: number) => (
          <div key={index} className="flex gap-2">
            <Input
              value={header}
              onChange={(e) => updateArrayItem("headers", index, e.target.value)}
              placeholder={`Header ${index + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeArrayItem("headers", index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addArrayItem("headers", "")}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Header
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Rows</Label>
        {(block as any).rows?.map((row: string[], rowIndex: number) => (
          <div key={rowIndex} className="space-y-2 p-3 border rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Row {rowIndex + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const currentRows = (block as any).rows || [];
                  const newRows = currentRows.filter((_: any, i: number) => i !== rowIndex);
                  updateBlock({ rows: newRows });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {row.map((cell: string, cellIndex: number) => (
                <Input
                  key={cellIndex}
                  value={cell}
                  onChange={(e) => {
                    const currentRows = (block as any).rows || [];
                    const newRows = [...currentRows];
                    newRows[rowIndex] = [...newRows[rowIndex]];
                    newRows[rowIndex][cellIndex] = e.target.value;
                    updateBlock({ rows: newRows });
                  }}
                  placeholder={`Cell ${cellIndex + 1}`}
                />
              ))}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const currentRows = (block as any).rows || [];
            const headers = (block as any).headers || [];
            const newRow = new Array(headers.length).fill("");
            updateBlock({ rows: [...currentRows, newRow] });
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Row
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Variant</Label>
        <Select
          value={(block as any).variant || "simple"}
          onValueChange={(value) => updateBlock({ variant: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple</SelectItem>
            <SelectItem value="striped">Striped</SelectItem>
            <SelectItem value="bordered">Bordered</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderFeatureGridBlock = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={(block as any).title || ""}
          onChange={(e) => updateBlock({ title: e.target.value })}
          placeholder="Feature grid title"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={(block as any).description || ""}
          onChange={(e) => updateBlock({ description: e.target.value })}
          placeholder="Optional description"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Columns</Label>
          <Select
            value={(block as any).columns || "2"}
            onValueChange={(value) => updateBlock({ columns: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select
            value={(block as any).variant || "simple"}
            onValueChange={(value) => updateBlock({ variant: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="detailed">Detailed (with tips & importance)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Features</Label>
        {(block as any).features?.map((feature: any, index: number) => (
          <div key={index} className="space-y-3 p-3 border rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Feature {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFeature(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Input
                value={feature.title || ""}
                onChange={(e) => updateFeature(index, "title", e.target.value)}
                placeholder="Feature title"
              />
              <Input
                value={feature.description || ""}
                onChange={(e) => updateFeature(index, "description", e.target.value)}
                placeholder="Feature description"
              />
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={feature.icon || "Star"}
                  onValueChange={(value) => updateFeature(index, "icon", value)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {renderIcon(feature.icon || "Star")}
                        <span>{feature.icon || "Star"}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {renderIcon(icon)}
                          <span>{icon}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={feature.color || "purple"}
                  onValueChange={(value) => updateFeature(index, "color", value)}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-4 h-4 rounded-full border-2 border-gray-300 ${
                            feature.color === "purple" ? "bg-purple-500" :
                            feature.color === "blue" ? "bg-blue-500" :
                            feature.color === "green" ? "bg-green-500" :
                            feature.color === "yellow" ? "bg-yellow-500" :
                            feature.color === "red" ? "bg-red-500" :
                            "bg-purple-500"
                          }`}
                        />
                        <span className="capitalize">{feature.color || "purple"}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purple">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-gray-300" />
                        <span>Purple</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="blue">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-300" />
                        <span>Blue</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="green">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-gray-300" />
                        <span>Green</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="yellow">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-gray-300" />
                        <span>Yellow</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="red">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-gray-300" />
                        <span>Red</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(block as any).variant === "detailed" && (
                <>
                  <Select
                    value={feature.importance || "Medium"}
                    onValueChange={(value) => updateFeature(index, "importance", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="space-y-2">
                    <Label>Tips</Label>
                    {feature.tips?.map((tip: string, tipIndex: number) => (
                      <div key={tipIndex} className="flex gap-2">
                        <Input
                          value={tip}
                          onChange={(e) => updateFeatureTip(index, tipIndex, e.target.value)}
                          placeholder={`Tip ${tipIndex + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeatureTip(index, tipIndex)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addFeatureTip(index)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Tip
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFeature}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Feature
        </Button>
      </div>
    </div>
  );

  const renderRequirementsBlock = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={(block as any).title || ""}
          onChange={(e) => updateBlock({ title: e.target.value })}
          placeholder="Requirements title"
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={(block as any).description || ""}
          onChange={(e) => updateBlock({ description: e.target.value })}
          placeholder="Optional description"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Columns</Label>
          <Select
            value={(block as any).columns || "2"}
            onValueChange={(value) => updateBlock({ columns: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Column</SelectItem>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select
            value={(block as any).variant || "cards"}
            onValueChange={(value) => updateBlock({ variant: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cards">Cards</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Requirements</Label>
        {(block as any).requirements?.map((req: any, index: number) => (
          <div key={index} className="space-y-3 p-3 border rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Requirement {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRequirement(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Input
                value={req.title || ""}
                onChange={(e) => updateRequirement(index, "title", e.target.value)}
                placeholder="Requirement title"
              />
              <Input
                value={req.description || ""}
                onChange={(e) => updateRequirement(index, "description", e.target.value)}
                placeholder="Requirement description"
              />
              <Select
                value={req.icon || "CheckCircle"}
                onValueChange={(value) => updateRequirement(index, "icon", value)}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {renderIcon(req.icon || "CheckCircle")}
                      <span>{req.icon || "CheckCircle"}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((icon) => (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        {renderIcon(icon)}
                        <span>{icon}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRequirement}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Requirement
        </Button>
      </div>
    </div>
  );

  switch (block.type) {
    case "card":
      return renderCardBlock();
    case "step":
      return renderStepBlock();
    case "alert":
      return renderAlertBlock();
    case "table":
      return renderTableBlock();
    case "feature-grid":
      return renderFeatureGridBlock();
    case "requirements":
      return renderRequirementsBlock();
    default:
      return <div>Unknown block type: {block.type}</div>;
  }
}
