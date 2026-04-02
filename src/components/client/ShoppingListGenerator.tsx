import { jsPDF } from 'jspdf'
import type { Ingredient } from '../../types'

type ShoppingListGeneratorProps = {
  ingredients: Ingredient[]
}

export default function ShoppingListGenerator({ ingredients }: ShoppingListGeneratorProps) {
  const downloadPdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Weekly Shopping List', 14, 18)
    doc.setFontSize(11)

    let y = 30
    ingredients.forEach((item) => {
      doc.text(`- ${item.name}: ${item.amount}g`, 14, y)
      y += 8
    })

    doc.save('shopping-list.pdf')
  }

  return (
    <section className="glass-panel card-entrance p-4">
      <h3 className="text-sm font-semibold">Shopping List Generator</h3>
      <p className="mt-1 text-xs text-[var(--muted)]">Generate a PDF list from your weekly meal plan ingredients.</p>
      <button type="button" onClick={downloadPdf} className="mt-3 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white">
        Download PDF
      </button>
    </section>
  )
}
