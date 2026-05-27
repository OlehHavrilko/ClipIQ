import type { Metadata } from 'next'
import { InspectClient } from './InspectClient'

export const metadata: Metadata = {
  title: 'Shared Media — ClipIQ',
  description: 'View and download shared media via ClipIQ',
}

export default function InspectPage({ params }: { params: { id: string } }) {
  return <InspectClient jobId={params.id} />
}
