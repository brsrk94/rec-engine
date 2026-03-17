import { AssessmentEquipmentImage, type AssessmentEquipmentId } from '@/components/assessment/equipment-image'

const equipmentTypes = [
  {
    id: 'motor',
    name: 'Industrial Motors',
    savings: 'Up to 30% energy savings',
  },
  {
    id: 'compressor',
    name: 'Air Compressors',
    savings: 'Up to 35% energy savings',
  },
  {
    id: 'bldc_fan',
    name: 'BLDC Ceiling Fans',
    savings: 'Up to 65% energy savings',
  },
  {
    id: 'air_conditioner',
    name: 'Air Conditioners',
    savings: 'Up to 40% energy savings',
  },
  {
    id: 'led_retrofit',
    name: 'LED Retrofit',
    savings: 'Up to 80% energy savings',
  },
  {
    id: 'dg_set',
    name: 'DG Sets',
    savings: 'Up to 20% fuel savings',
  },
]

export function EquipmentSection() {
  return (
    <section
      id="equipment"
      className="scroll-mt-24 bg-secondary/30 py-12 sm:py-14 md:scroll-mt-28 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Equipment We Assess
          </h2>
        </div>

        <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {equipmentTypes.map((equipment) => (
            <div
              key={equipment.id}
              className="flex h-full flex-col rounded-xl border bg-card p-4 shadow-sm sm:p-5"
            >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 sm:h-12 sm:w-12">
                  <AssessmentEquipmentImage
                    equipmentId={equipment.id as AssessmentEquipmentId}
                    className="h-9 w-9 border-0 shadow-none"
                    roundedClassName="rounded-lg"
                    sizes="36px"
                    priority={equipment.id === 'motor'}
                  />
                </div>
                <h3 className="mb-1.5 text-base font-semibold sm:text-lg">{equipment.name}</h3>
                <span className="mt-auto text-sm font-medium text-primary">{equipment.savings}</span>
              </div>
          ))}
        </div>
      </div>
    </section>
  )
}
