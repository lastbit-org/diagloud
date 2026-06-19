import {
  nodesOfKind,
  vpcNodeForSubnet,
  type TerraformGenContext,
} from "../context";
import { defaultZone, escapeHclString, sectionHeader } from "../hcl";

export function generateMlTerraform(ctx: TerraformGenContext): string {
  const blocks: string[] = [sectionHeader("IA e analytics")];

  for (const node of nodesOfKind(ctx, "workbench")) {
    const subnetId = ctx.graph.subnetForWorkbench.get(node.id);
    const chain = subnetId ? vpcNodeForSubnet(ctx, subnetId) : undefined;
    const resourceName = ctx.getTfResourceName(node);
    const zone = defaultZone(node.data.region);

    const networkBlock = chain
      ? `
  gce_setup {
    machine_type = "${escapeHclString(node.data.machineType)}"
    network_interfaces {
      network = google_compute_network.${ctx.getTfResourceName(chain.vpc)}.id
      subnet  = google_compute_subnetwork.${ctx.getTfResourceName(chain.subnet)}.id
    }${
      node.data.internalIp?.trim()
        ? `\n    # IP interno no diagrama: ${escapeHclString(node.data.internalIp.trim())}`
        : ""
    }
  }`
      : `
  gce_setup {
    machine_type = "${escapeHclString(node.data.machineType)}"
  }`;

    blocks.push(`resource "google_workbench_instance" "${resourceName}" {
  name     = "${escapeHclString(node.data.name)}"
  location = "${escapeHclString(zone)}"${networkBlock}
}`);
  }

  for (const node of nodesOfKind(ctx, "notebook")) {
    const subnetId = ctx.graph.subnetForNotebook.get(node.id);
    const chain = subnetId ? vpcNodeForSubnet(ctx, subnetId) : undefined;
    const resourceName = ctx.getTfResourceName(node);
    const zone = defaultZone(node.data.region);

    const networkBlock = chain
      ? `
  network = google_compute_network.${ctx.getTfResourceName(chain.vpc)}.id
  subnet  = google_compute_subnetwork.${ctx.getTfResourceName(chain.subnet)}.id${
        node.data.internalIp?.trim()
          ? `\n  # IP interno no diagrama: ${escapeHclString(node.data.internalIp.trim())}`
          : ""
      }`
      : "";

    blocks.push(`resource "google_notebooks_instance" "${resourceName}" {
  name         = "${escapeHclString(node.data.name)}"
  location     = "${escapeHclString(zone)}"
  machine_type = "${escapeHclString(node.data.machineType)}"${networkBlock}
}`);
  }

  for (const node of nodesOfKind(ctx, "spark")) {
    const resourceName = ctx.getTfResourceName(node);

    if (node.data.deployMode === "serverless") {
      blocks.push(`resource "google_dataproc_batch" "${resourceName}" {
  batch_id = "${escapeHclString(node.data.name)}"
  region   = "${escapeHclString(node.data.region)}"

  pyspark_batch {
    main_python_file_uri = "gs://your-bucket/main.py"
  }

  runtime_config {
    version = "2.2"
  }
}`);
      continue;
    }

    const subnetId = ctx.graph.subnetForSpark.get(node.id);
    const chain = subnetId ? vpcNodeForSubnet(ctx, subnetId) : undefined;
    if (!chain) continue;

    blocks.push(`resource "google_dataproc_cluster" "${resourceName}" {
  name   = "${escapeHclString(node.data.name)}"
  region = "${escapeHclString(node.data.region)}"

  cluster_config {
    gce_cluster_config {
      subnetwork = google_compute_subnetwork.${ctx.getTfResourceName(chain.subnet)}.self_link
      zone       = "${escapeHclString(defaultZone(node.data.region))}"
    }

    master_config {
      num_instances = 1
      machine_type  = "n2-standard-2"
    }

    worker_config {
      num_instances = 2
      machine_type  = "n2-standard-2"
    }
  }
}`);
  }

  for (const node of nodesOfKind(ctx, "airflow")) {
    const subnetId = ctx.graph.subnetForAirflow.get(node.id);
    const chain = subnetId ? vpcNodeForSubnet(ctx, subnetId) : undefined;
    if (!chain) continue;

    const resourceName = ctx.getTfResourceName(node);

    blocks.push(`resource "google_composer_environment" "${resourceName}" {
  name   = "${escapeHclString(node.data.name)}"
  region = "${escapeHclString(node.data.region)}"

  config {
    software_config {
      image_version = "composer-3-airflow-2.9.3-build.0"
    }

    node_config {
      network    = google_compute_network.${ctx.getTfResourceName(chain.vpc)}.id
      subnetwork = google_compute_subnetwork.${ctx.getTfResourceName(chain.subnet)}.id
    }
  }
}`);
  }

  for (const node of nodesOfKind(ctx, "dataflow")) {
    const resourceName = ctx.getTfResourceName(node);
    const subnetId = ctx.graph.subnetForDataflow.get(node.id);
    const chain = subnetId ? vpcNodeForSubnet(ctx, subnetId) : undefined;

    const networkBlock = chain
      ? `
  network    = google_compute_network.${ctx.getTfResourceName(chain.vpc)}.id
  subnetwork = google_compute_subnetwork.${ctx.getTfResourceName(chain.subnet)}.id`
      : "";

    blocks.push(`resource "google_dataflow_flex_template_job" "${resourceName}" {
  name                    = "${escapeHclString(node.data.name)}"
  region                  = "${escapeHclString(node.data.region)}"
  container_spec_gcs_path = "gs://dataflow-templates/latest/PubSub_Subscription_to_BigQuery"
  temp_location           = "gs://your-dataflow-temp-bucket/temp"${networkBlock}

  parameters = {
    inputSubscription = "projects/\${var.project_id}/subscriptions/your-subscription"
    outputTableSpec   = "your-project:your_dataset.your_table"
  }

  # Tipo de pipeline no diagrama: ${node.data.pipelineType}
}`);
  }

  for (const node of nodesOfKind(ctx, "modelregistry")) {
    const resourceName = ctx.getTfResourceName(node);

    blocks.push(`resource "google_vertex_ai_model" "${resourceName}" {
  display_name = "${escapeHclString(node.data.name)}"
  region       = "${escapeHclString(node.data.location)}"

  artifact_uri = "gs://your-bucket/models/${escapeHclString(node.data.name)}"

  container_spec {
    image_uri = "us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-0:latest"
  }
}`);
  }

  for (const node of nodesOfKind(ctx, "tuning")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`# Agent Platform — Tuning: ${escapeHclString(node.data.name)} (${escapeHclString(node.data.location)})
# resource "google_vertex_ai_hyperparameter_tuning_job" "${resourceName}" { ... }`);
  }

  for (const node of nodesOfKind(ctx, "evaluation")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`# Agent Platform — Evaluation: ${escapeHclString(node.data.name)} (${escapeHclString(node.data.location)})
# resource "google_vertex_ai_model_evaluation" "${resourceName}" { ... }`);
  }

  for (const node of nodesOfKind(ctx, "endpoints")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`resource "google_vertex_ai_endpoint" "${resourceName}" {
  name         = "${escapeHclString(node.data.name)}"
  display_name = "${escapeHclString(node.data.name)}"
  location     = "${escapeHclString(node.data.location)}"
}`);
  }

  for (const node of nodesOfKind(ctx, "batchinference")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`# Agent Platform — Batch inference: ${escapeHclString(node.data.name)} (${escapeHclString(node.data.location)})
# resource "google_vertex_ai_batch_prediction_job" "${resourceName}" { ... }`);
  }

  for (const node of nodesOfKind(ctx, "featurestore")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`# Agent Platform — Feature Store: ${escapeHclString(node.data.name)} (${escapeHclString(node.data.location)})
# resource "google_vertex_ai_featurestore" "${resourceName}" { ... }`);
  }

  for (const node of nodesOfKind(ctx, "experiments")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`# Agent Platform — Experiments: ${escapeHclString(node.data.name)} (${escapeHclString(node.data.location)})
# resource "google_vertex_ai_metadata_store" "${resourceName}" { ... }`);
  }

  for (const node of nodesOfKind(ctx, "training")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`# Agent Platform — Training: ${escapeHclString(node.data.name)} (${escapeHclString(node.data.location)})
# resource "google_vertex_ai_custom_job" "${resourceName}" { ... }`);
  }

  for (const node of nodesOfKind(ctx, "pipelines")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`# Agent Platform — Pipelines: ${escapeHclString(node.data.name)} (${escapeHclString(node.data.location)})
# resource "google_vertex_ai_pipeline_job" "${resourceName}" { ... }`);
  }

  for (const node of nodesOfKind(ctx, "mlmonitoring")) {
    const resourceName = ctx.getTfResourceName(node);
    blocks.push(`# Agent Platform — Monitoring: ${escapeHclString(node.data.name)} (${escapeHclString(node.data.location)})
# resource "google_vertex_ai_model_deployment_monitoring_job" "${resourceName}" { ... }`);
  }

  return blocks.length > 1 ? blocks.join("\n\n") : "";
}
