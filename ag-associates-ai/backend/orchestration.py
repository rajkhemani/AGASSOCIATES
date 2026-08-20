"""Orchestration engine for coordinating multiple agents on complex workflows.

This module provides workflow orchestration capabilities that allow
multiple agents to collaborate on complex tasks that require
sequential or parallel agent execution.
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum

from agents.agent_bus import send_message, request_response
from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class WorkflowStepType(Enum):
    """Types of steps in an orchestration workflow."""
    AGENT_REQUEST = "agent_request"
    AGENT_BROADCAST = "agent_broadcast"
    CONDITION = "condition"
    DELAY = "delay"


@dataclass
class WorkflowStep:
    """A single step in an orchestration workflow."""
    id: str
    type: WorkflowStepType
    agent_name: Optional[str] = None
    message: str = ""
    target_agents: List[str] = field(default_factory=list)
    condition: Optional[Callable[[Dict[str, Any]], bool]] = None
    delay_seconds: float = 0
    next_step_on_success: Optional[str] = None
    next_step_on_failure: Optional[str] = None
    timeout_seconds: float = 30.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WorkflowDefinition:
    """Definition of an orchestration workflow."""
    workflow_id: str
    name: str
    description: str
    steps: List[WorkflowStep]
    initial_step: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class WorkflowOrchestrator:
    """Orchestrates workflows involving multiple agents."""
    
    def __init__(self):
        self.workflows: Dict[str, WorkflowDefinition] = {}
        self.active_workflows: Dict[str, Dict[str, Any]] = {}
        
    def register_workflow(self, workflow: WorkflowDefinition):
        """Register a workflow definition."""
        self.workflows[workflow.workflow_id] = workflow
        logger.info(f"Registered workflow: {workflow.workflow_id}")
        
    async def execute_workflow(
        self, 
        workflow_id: str, 
        initial_data: Dict[str, Any],
        execution_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a registered workflow."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} not found")
            
        workflow = self.workflows[workflow_id]
        exec_id = execution_id or f"{workflow_id}_{asyncio.get_event_loop().time()}"
        
        # Initialize workflow execution state
        execution_state = {
            "workflow_id": workflow_id,
            "execution_id": exec_id,
            "current_step_id": workflow.initial_step,
            "data": initial_data.copy(),
            "step_results": {},
            "completed": False,
            "failed": False,
            "error": None
        }
        
        self.active_workflows[exec_id] = execution_state
        
        try:
            result = await self._execute_workflow_loop(execution_state)
            return result
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            execution_state["failed"] = True
            execution_state["error"] = str(e)
            return {
                "success": False,
                "error": str(e),
                "execution_id": exec_id
            }
        finally:
            # Clean up after completion or failure
            if execution_state.get("completed") or execution_state.get("failed"):
                self.active_workflows.pop(exec_id, None)
                
    async def _execute_workflow_loop(self, execution_state: Dict[str, Any]) -> Dict[str, Any]:
        """Main workflow execution loop."""
        workflow_id = execution_state["workflow_id"]
        workflow = self.workflows[workflow_id]
        
        while not execution_state["completed"] and not execution_state["failed"]:
            current_step_id = execution_state["current_step_id"]
            
            # Find the current step
            current_step = None
            for step in workflow.steps:
                if step.id == current_step_id:
                    current_step = step
                    break
                    
            if not current_step:
                execution_state["failed"] = True
                execution_state["error"] = f"Step {current_step_id} not found in workflow"
                break
                
            logger.info(f"Executing step {current_step_id} of workflow {workflow_id}")
            
            # Execute the step based on its type
            try:
                if current_step.type == WorkflowStepType.AGENT_REQUEST:
                    result = await self._execute_agent_request_step(
                        current_step, execution_state
                    )
                elif current_step.type == WorkflowStepType.AGENT_BROADCAST:
                    result = await self._execute_agent_broadcast_step(
                        current_step, execution_state
                    )
                elif current_step.type == WorkflowStepType.CONDITION:
                    result = await self._execute_condition_step(
                        current_step, execution_state
                    )
                elif current_step.type == WorkflowStepType.DELAY:
                    result = await self._execute_delay_step(
                        current_step, execution_state
                    )
                else:
                    raise ValueError(f"Unknown step type: {current_step.type}")
                    
                # Handle step result
                if result.get("success", False):
                    execution_state["step_results"][current_step_id] = result
                    # Move to next step on success
                    next_step = current_step.next_step_on_success
                    if next_step:
                        execution_state["current_step_id"] = next_step
                    else:
                        # No next step - workflow is complete
                        execution_state["completed"] = True
                else:
                    # Step failed
                    execution_state["step_results"][current_step_id] = result
                    # Move to next step on failure
                    next_step = current_step.next_step_on_failure
                    if next_step:
                        execution_state["current_step_id"] = next_step
                    else:
                        # No failure path - workflow failed
                        execution_state["failed"] = True
                        execution_state["error"] = result.get("error", "Step failed")
                        
            except Exception as e:
                logger.error(f"Error executing step {current_step_id}: {e}")
                execution_state["failed"] = True
                execution_state["error"] = str(e)
                break
                
        # Return final result
        if execution_state["completed"]:
            return {
                "success": True,
                "execution_id": execution_state["execution_id"],
                "workflow_id": workflow_id,
                "step_results": execution_state["step_results"],
                "final_data": execution_state["data"]
            }
        else:
            return {
                "success": False,
                "execution_id": execution_state["execution_id"],
                "workflow_id": workflow_id,
                "error": execution_state.get("error", "Unknown error"),
                "step_results": execution_state["step_results"]
            }
            
    async def _execute_agent_request_step(
        self, 
        step: WorkflowStep, 
        execution_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a step that requests a specific agent."""
        if not step.agent_name:
            return {"success": False, "error": "No agent specified for agent_request step"}
            
        # Prepare message with context from previous steps
        message = step.message
        # Replace placeholders with data from execution state
        for key, value in execution_state["data"].items():
            message = message.replace(f"{{{key}}}", str(value))
            
        # Also include results from previous steps
        for step_id, result in execution_state["step_results"].items():
            if isinstance(result, dict) and "response" in result:
                message = message.replace(f"{{step_{step_id}}}", str(result["response"]))
                
        try:
            # Request the agent via the agent bus
            response = await request_response(
                source="orchestrator",
                target=step.agent_name,
                payload={
                    "message": message,
                    "user_id": execution_state["data"].get("user_id", "orchestrator"),
                    "user_role": execution_state["data"].get("user_role", "CLERK"),
                    "conversation_id": execution_state["data"].get("conversation_id")
                },
                timeout=step.timeout_seconds
            )
            
            if response:
                return {
                    "success": True,
                    "response": response.get("text", ""),
                    "data": response.get("data", {}),
                    "agent": step.agent_name
                }
            else:
                return {
                    "success": False,
                    "error": f"No response from agent {step.agent_name}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error requesting agent {step.agent_name}: {str(e)}"
            }
            
    async def _execute_agent_broadcast_step(
        self, 
        step: WorkflowStep, 
        execution_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a step that broadcasts to multiple agents."""
        if not step.target_agents:
            return {"success": False, "error": "No target agents specified for agent_broadcast step"}
            
        # Prepare message with context
        message = step.message
        for key, value in execution_state["data"].items():
            message = message.replace(f"{{{key}}}", str(value))
            
        results = {}
        for agent_name in step.target_agents:
            try:
                response = await request_response(
                    source="orchestrator",
                    target=agent_name,
                    payload={
                        "message": message,
                        "user_id": execution_state["data"].get("user_id", "orchestrator"),
                        "user_role": execution_state["data"].get("user_role", "CLERK"),
                        "conversation_id": execution_state["data"].get("conversation_id")
                    },
                    timeout=step.timeout_seconds
                )
                
                if response:
                    results[agent_name] = {
                        "success": True,
                        "response": response.get("text", ""),
                        "data": response.get("data", {})
                    }
                else:
                    results[agent_name] = {
                        "success": False,
                        "error": f"No response from agent {agent_name}"
                    }
                    
            except Exception as e:
                results[agent_name] = {
                    "success": False,
                    "error": f"Error requesting agent {agent_name}: {str(e)}"
                }
                
        # Determine overall success based on agent results
        successful_agents = [name for name, result in results.items() if result.get("success")]
        all_success = len(successful_agents) == len(step.target_agents)
        
        return {
            "success": all_success,
            "results": results,
            "successful_agents": successful_agents,
            "total_agents": len(step.target_agents)
        }
        
    async def _execute_condition_step(
        self, 
        step: WorkflowStep, 
        execution_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a conditional step."""
        if not step.condition:
            return {"success": False, "error": "No condition specified for condition step"}
            
        try:
            # Evaluate condition with current state
            condition_result = step.condition(execution_state["data"])
            
            return {
                "success": True,
                "condition_result": condition_result,
                "next_step": step.next_step_on_success if condition_result else step.next_step_on_failure
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Error evaluating condition: {str(e)}"
            }
            
    async def _execute_delay_step(
        self, 
        step: WorkflowStep, 
        execution_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a delay step."""
        if step.delay_seconds > 0:
            logger.info(f"Delaying for {step.delay_seconds} seconds")
            await asyncio.sleep(step.delay_seconds)
            
        return {
            "success": True,
            "delayed_seconds": step.delay_seconds
        }


# Global orchestrator instance
orchestrator = WorkflowOrchestrator()


# Pre-defined workflows for common AG Associates processes

def create_noi_workflow() -> WorkflowDefinition:
    """Create a workflow for Notice of Intimation process."""
    steps = [
        WorkflowStep(
            id="extract_details",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="drafter",
            message="Extract property, borrower, bank, and loan details from this message: {message}",
            next_step_on_success="validate_documents"
        ),
        WorkflowStep(
            id="validate_documents",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="auditor",
            message="Validate that all required documents are present for NOI filing: {step_extract_details}",
            next_step_on_success="generate_challan",
            next_step_on_failure="request_missing_docs"
        ),
        WorkflowStep(
            id="request_missing_docs",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="drafter",
            message="Based on validation: {step_validate_documents}. Please request the missing documents from the user.",
            next_step_on_success="extract_details"  # Loop back to get missing docs
        ),
        WorkflowStep(
            id="generate_challan",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="noi",
            message="Generate GRAS challan for NOI filing with details: {step_extract_details}",
            next_step_on_success="notify_user"
        ),
        WorkflowStep(
            id="notify_user",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="drafter",
            message="NOI challan has been generated. Inform user about next steps for payment.",
            next_step_on_success=None  # End workflow
        )
    ]
    
    return WorkflowDefinition(
        workflow_id="noi_process",
        name="Notice of Intimation Process",
        description="End-to-end NOI filing process involving document extraction, validation, challan generation, and user notification",
        steps=steps,
        initial_step="extract_details"
    )


def create_mortgage_registration_workflow() -> WorkflowDefinition:
    """Create a workflow for mortgage registration process."""
    steps = [
        WorkflowStep(
            id="collect_details",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="drafter",
            message="Collect property, borrower, lender, and loan details for mortgage registration: {message}",
            next_step_on_success="draft_documents"
        ),
        WorkflowStep(
            id="draft_documents",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="drafter",
            message="Draft mortgage registration documents based on: {step_collect_details}",
            next_step_on_success="legal_review"
        ),
        WorkflowStep(
            id="legal_review",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="vyasa",
            message="Review drafted mortgage documents for legal compliance: {step_draft_documents}",
            next_step_on_success="financial_audit",
            next_step_on_failure="revise_drafts"
        ),
        WorkflowStep(
            id="revise_drafts",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="drafter",
            message="Revise documents based on legal review: {step_legal_review}",
            next_step_on_success="legal_review"  # Loop back for re-review
        ),
        WorkflowStep(
            id="financial_audit",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="auditor",
            message="Perform financial audit on mortgage transaction: {step_collect_details}",
            next_step_on_success="schedule_registration"
        ),
        WorkflowStep(
            id="schedule_registration",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="executor",
            message="Schedule mortgage registration with sub-registrar office: {step_financial_audit}",
            next_step_on_success="notify_user"
        ),
        WorkflowStep(
            id="notify_user",
            type=WorkflowStepType.AGENT_REQUEST,
            agent_name="drafter",
            message="Mortgage registration has been scheduled. Inform user of date and required documents.",
            next_step_on_success=None  # End workflow
        )
    ]
    
    return WorkflowDefinition(
        workflow_id="mortgage_registration_process",
        name="Mortgage Registration Process",
        description="End-to-end mortgage registration process involving document drafting, legal review, financial audit, and scheduling",
        steps=steps,
        initial_step="collect_details"
    )


# Register the predefined workflows
def initialize_workflows():
    """Initialize and register predefined workflows."""
    orchestrator.register_workflow(create_noi_workflow())
    orchestrator.register_workflow(create_mortgage_registration_workflow())
    logger.info("Predefined workflows initialized")


# Auto-initialize workflows when module is imported
initialize_workflows()