import * as path from 'path'
import ts from 'typescript'

describe('WebhookPayload', () => {
  it('accepts nullable Octokit bodies and preserves optional bodies', () => {
    const program = ts.createProgram(
      [path.join(__dirname, 'fixtures', 'webhook-payload.ts')],
      {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.Node16,
        moduleResolution: ts.ModuleResolutionKind.Node16,
        types: []
      }
    )
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .map(diagnostic =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      )

    expect(diagnostics).toEqual([])
  })
})
