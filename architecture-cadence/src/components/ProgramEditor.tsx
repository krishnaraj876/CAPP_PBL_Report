/**
 * Architecture Cadence - Assembly Editor & Program Lab
 * RISC-V assembly code editor, preset programs loader, machine code encoder,
 * and PC disassembly tracking view.
 */

import React, { useState } from 'react';
import { Instruction } from '../types/architecture';
import { PRESET_PROGRAMS, ProgramPreset } from '../simulator/programs';
import { Code, Play, CheckCircle2, AlertCircle, FileCode, Cpu } from 'lucide-react';

interface ProgramEditorProps {
  currentCode: string;
  instructions: Instruction[];
  currentPc: number;
  onAssembleAndLoad: (code: string) => void;
  errors: Array<{ line: number; message: string }>;
}

export const ProgramEditor: React.FC<ProgramEditorProps> = ({
  currentCode,
  instructions,
  currentPc,
  onAssembleAndLoad,
  errors,
}) => {
  const [codeText, setCodeText] = useState<string>(currentCode);
  const [selectedPreset, setSelectedPreset] = useState<string>('raw-forwarding');

  const handleSelectPreset = (preset: ProgramPreset) => {
    setSelectedPreset(preset.id);
    setCodeText(preset.code);
    onAssembleAndLoad(preset.code);
  };

  const handleApplyCustom = () => {
    onAssembleAndLoad(codeText);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Column: Preset Selector & Assembly Code Editor (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Preset Selector Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-[#e2e8f0]">
            <FileCode className="w-4 h-4 text-[#0284c7]" />
            <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
              Computer Architecture Laboratory Presets
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_PROGRAMS.map((preset) => {
              const isSelected = selectedPreset === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded text-left border transition-all ${
                    isSelected
                      ? 'border-[#0284c7] bg-[#eff4ff] ring-1 ring-[#0284c7]'
                      : 'border-[#e2e8f0] bg-white hover:bg-[#f8fafc] hover:border-[#cbd5e1]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-semibold text-xs text-[#0f2a4a]">
                      {preset.name}
                    </span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748b] line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assembly Code Editor */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
                RISC-V (RV32I) Assembly Source Code
              </h3>
            </div>
            <button
              onClick={handleApplyCustom}
              className="flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold bg-[#0f2a4a] hover:bg-[#0284c7] text-white transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Assemble &amp; Reload CPU</span>
            </button>
          </div>

          {/* Error Banner (if any) */}
          {errors.length > 0 && (
            <div className="bg-[#fef2f2] border-b border-[#fecaca] p-2.5 text-xs text-[#dc2626] space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Assembly Errors Found:</span>
              </div>
              {errors.map((err, i) => (
                <div key={i} className="font-mono text-[11px] pl-5">
                  Line {err.line}: {err.message}
                </div>
              ))}
            </div>
          )}

          {/* Textarea Editor */}
          <div className="p-3 bg-[#f8fafc]">
            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full font-mono text-xs text-[#0f2a4a] bg-white border border-[#cbd5e1] rounded p-3 outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] leading-relaxed resize-y"
              placeholder="# Write RISC-V assembly code here...&#10;addi x1, x0, 10&#10;add x2, x1, x1"
            />
          </div>
        </div>
      </div>

      {/* Right Column: Encoded Machine Code & Program Counter Disassembly (5 cols) */}
      <div className="lg:col-span-5">
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
          <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-[#0284c7]" />
              <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
                Instruction Memory &amp; Machine Code
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#0284c7]">
              {instructions.length} Instructions
            </span>
          </div>

          <div className="overflow-y-auto max-h-[540px] flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-[#eff4ff] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#0f2a4a] z-10">
                <tr>
                  <th className="py-2 px-2.5 w-16 font-mono">PC</th>
                  <th className="py-2 px-2.5 border-l border-[#e2e8f0] w-28 font-mono">Hex (32-bit)</th>
                  <th className="py-2 px-2.5 border-l border-[#e2e8f0] font-mono">Disassembly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] font-mono text-[11px]">
                {instructions.map((inst) => {
                  const isCurrentPc = inst.address === currentPc;

                  return (
                    <tr
                      key={inst.id}
                      className={`hover:bg-[#f8fafc] transition-colors ${
                        isCurrentPc ? 'bg-[#ecfeff] font-bold border-l-4 border-l-[#06b6d4]' : ''
                      }`}
                    >
                      <td className="py-2 px-2.5 text-[#0f2a4a]">
                        <span className="flex items-center space-x-1">
                          {isCurrentPc && <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]" />}
                          <span>0x{inst.address.toString(16).padStart(4, '0').toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="py-2 px-2.5 border-l border-[#f1f5f9] text-[#0284c7] font-semibold">
                        {inst.hexCode}
                      </td>
                      <td className="py-2 px-2.5 border-l border-[#f1f5f9] text-[#0f2a4a]">
                        {inst.label && (
                          <span className="text-[#059669] font-bold mr-1">{inst.label}:</span>
                        )}
                        <span>{inst.text}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-[#e2e8f0] bg-[#f8fafc] text-xs flex items-center justify-between text-[#64748b]">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>Syntactically Valid RV32I</span>
            </div>
            <span>Current PC: 0x{currentPc.toString(16).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
