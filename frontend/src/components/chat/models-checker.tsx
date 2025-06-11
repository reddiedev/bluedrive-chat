import { useQuery } from "@tanstack/react-query"
import { getModels } from "~/lib/api"
import { toast } from "sonner"
import { Fragment } from "react"

function ModelsChecker() {
  const { data: models } = useQuery({ queryKey: ['models'], queryFn: getModels })
  if (models) {
    console.log(`[ModelsChecker]: Found ${models?.length} Ollama models`)
  }

  if (models && models.length == 0) {
    toast.error("No Ollama models found", {
      description: "Please check your backend server configuration and make sure that Ollama is running and that the models are loaded.",
      duration: 10000,
      id: "no-models-found",
    })
  }

  return <Fragment />
}

export default ModelsChecker