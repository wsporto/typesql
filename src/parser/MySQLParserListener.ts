// Generated from grammar\MySQLParser.g4 by ANTLR 4.7.3-SNAPSHOT


    const serverVersion =80000;


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

import { SimpleExprVariableContext } from "./MySQLParser";
import { SimpleExprColumnRefContext } from "./MySQLParser";
import { SimpleExprRuntimeFunctionContext } from "./MySQLParser";
import { SimpleExprFunctionContext } from "./MySQLParser";
import { SimpleExprCollateContext } from "./MySQLParser";
import { SimpleExprLiteralContext } from "./MySQLParser";
import { SimpleExprParamMarkerContext } from "./MySQLParser";
import { SimpleExprSumContext } from "./MySQLParser";
import { SimpleExprGroupingOperationContext } from "./MySQLParser";
import { SimpleExprWindowingFunctionContext } from "./MySQLParser";
import { SimpleExprConcatContext } from "./MySQLParser";
import { SimpleExprUnaryContext } from "./MySQLParser";
import { SimpleExprNotContext } from "./MySQLParser";
import { SimpleExprListContext } from "./MySQLParser";
import { SimpleExprSubQueryContext } from "./MySQLParser";
import { SimpleExprOdbcContext } from "./MySQLParser";
import { SimpleExprMatchContext } from "./MySQLParser";
import { SimpleExprBinaryContext } from "./MySQLParser";
import { SimpleExprCastContext } from "./MySQLParser";
import { SimpleExprCaseContext } from "./MySQLParser";
import { SimpleExprConvertContext } from "./MySQLParser";
import { SimpleExprConvertUsingContext } from "./MySQLParser";
import { SimpleExprDefaultContext } from "./MySQLParser";
import { SimpleExprValuesContext } from "./MySQLParser";
import { SimpleExprIntervalContext } from "./MySQLParser";
import { PrimaryExprPredicateContext } from "./MySQLParser";
import { PrimaryExprIsNullContext } from "./MySQLParser";
import { PrimaryExprCompareContext } from "./MySQLParser";
import { PrimaryExprAllAnyContext } from "./MySQLParser";
import { PredicateExprInContext } from "./MySQLParser";
import { PredicateExprBetweenContext } from "./MySQLParser";
import { PredicateExprLikeContext } from "./MySQLParser";
import { PredicateExprRegexContext } from "./MySQLParser";
import { ExprIsContext } from "./MySQLParser";
import { ExprNotContext } from "./MySQLParser";
import { ExprAndContext } from "./MySQLParser";
import { ExprXorContext } from "./MySQLParser";
import { ExprOrContext } from "./MySQLParser";
import { PartitionDefKeyContext } from "./MySQLParser";
import { PartitionDefHashContext } from "./MySQLParser";
import { PartitionDefRangeListContext } from "./MySQLParser";
import { QueryContext } from "./MySQLParser";
import { SimpleStatementContext } from "./MySQLParser";
import { AlterStatementContext } from "./MySQLParser";
import { AlterDatabaseContext } from "./MySQLParser";
import { AlterEventContext } from "./MySQLParser";
import { AlterLogfileGroupContext } from "./MySQLParser";
import { AlterLogfileGroupOptionsContext } from "./MySQLParser";
import { AlterLogfileGroupOptionContext } from "./MySQLParser";
import { AlterServerContext } from "./MySQLParser";
import { AlterTableContext } from "./MySQLParser";
import { AlterTableActionsContext } from "./MySQLParser";
import { AlterCommandListContext } from "./MySQLParser";
import { AlterCommandsModifierListContext } from "./MySQLParser";
import { StandaloneAlterCommandsContext } from "./MySQLParser";
import { AlterPartitionContext } from "./MySQLParser";
import { AlterListContext } from "./MySQLParser";
import { AlterCommandsModifierContext } from "./MySQLParser";
import { AlterListItemContext } from "./MySQLParser";
import { PlaceContext } from "./MySQLParser";
import { RestrictContext } from "./MySQLParser";
import { AlterOrderListContext } from "./MySQLParser";
import { AlterAlgorithmOptionContext } from "./MySQLParser";
import { AlterLockOptionContext } from "./MySQLParser";
import { IndexLockAndAlgorithmContext } from "./MySQLParser";
import { WithValidationContext } from "./MySQLParser";
import { RemovePartitioningContext } from "./MySQLParser";
import { AllOrPartitionNameListContext } from "./MySQLParser";
import { ReorgPartitionRuleContext } from "./MySQLParser";
import { AlterTablespaceContext } from "./MySQLParser";
import { AlterUndoTablespaceContext } from "./MySQLParser";
import { UndoTableSpaceOptionsContext } from "./MySQLParser";
import { UndoTableSpaceOptionContext } from "./MySQLParser";
import { AlterTablespaceOptionsContext } from "./MySQLParser";
import { AlterTablespaceOptionContext } from "./MySQLParser";
import { ChangeTablespaceOptionContext } from "./MySQLParser";
import { AlterViewContext } from "./MySQLParser";
import { ViewTailContext } from "./MySQLParser";
import { ViewSelectContext } from "./MySQLParser";
import { ViewCheckOptionContext } from "./MySQLParser";
import { CreateStatementContext } from "./MySQLParser";
import { CreateDatabaseContext } from "./MySQLParser";
import { CreateDatabaseOptionContext } from "./MySQLParser";
import { CreateTableContext } from "./MySQLParser";
import { TableElementListContext } from "./MySQLParser";
import { TableElementContext } from "./MySQLParser";
import { DuplicateAsQueryExpressionContext } from "./MySQLParser";
import { QueryExpressionOrParensContext } from "./MySQLParser";
import { CreateRoutineContext } from "./MySQLParser";
import { CreateProcedureContext } from "./MySQLParser";
import { CreateFunctionContext } from "./MySQLParser";
import { CreateUdfContext } from "./MySQLParser";
import { RoutineCreateOptionContext } from "./MySQLParser";
import { RoutineAlterOptionsContext } from "./MySQLParser";
import { RoutineOptionContext } from "./MySQLParser";
import { CreateIndexContext } from "./MySQLParser";
import { IndexNameAndTypeContext } from "./MySQLParser";
import { CreateIndexTargetContext } from "./MySQLParser";
import { CreateLogfileGroupContext } from "./MySQLParser";
import { LogfileGroupOptionsContext } from "./MySQLParser";
import { LogfileGroupOptionContext } from "./MySQLParser";
import { CreateServerContext } from "./MySQLParser";
import { ServerOptionsContext } from "./MySQLParser";
import { ServerOptionContext } from "./MySQLParser";
import { CreateTablespaceContext } from "./MySQLParser";
import { CreateUndoTablespaceContext } from "./MySQLParser";
import { TsDataFileNameContext } from "./MySQLParser";
import { TsDataFileContext } from "./MySQLParser";
import { TablespaceOptionsContext } from "./MySQLParser";
import { TablespaceOptionContext } from "./MySQLParser";
import { TsOptionInitialSizeContext } from "./MySQLParser";
import { TsOptionUndoRedoBufferSizeContext } from "./MySQLParser";
import { TsOptionAutoextendSizeContext } from "./MySQLParser";
import { TsOptionMaxSizeContext } from "./MySQLParser";
import { TsOptionExtentSizeContext } from "./MySQLParser";
import { TsOptionNodegroupContext } from "./MySQLParser";
import { TsOptionEngineContext } from "./MySQLParser";
import { TsOptionWaitContext } from "./MySQLParser";
import { TsOptionCommentContext } from "./MySQLParser";
import { TsOptionFileblockSizeContext } from "./MySQLParser";
import { TsOptionEncryptionContext } from "./MySQLParser";
import { CreateViewContext } from "./MySQLParser";
import { ViewReplaceOrAlgorithmContext } from "./MySQLParser";
import { ViewAlgorithmContext } from "./MySQLParser";
import { ViewSuidContext } from "./MySQLParser";
import { CreateTriggerContext } from "./MySQLParser";
import { TriggerFollowsPrecedesClauseContext } from "./MySQLParser";
import { CreateEventContext } from "./MySQLParser";
import { CreateRoleContext } from "./MySQLParser";
import { CreateSpatialReferenceContext } from "./MySQLParser";
import { SrsAttributeContext } from "./MySQLParser";
import { DropStatementContext } from "./MySQLParser";
import { DropDatabaseContext } from "./MySQLParser";
import { DropEventContext } from "./MySQLParser";
import { DropFunctionContext } from "./MySQLParser";
import { DropProcedureContext } from "./MySQLParser";
import { DropIndexContext } from "./MySQLParser";
import { DropLogfileGroupContext } from "./MySQLParser";
import { DropLogfileGroupOptionContext } from "./MySQLParser";
import { DropServerContext } from "./MySQLParser";
import { DropTableContext } from "./MySQLParser";
import { DropTableSpaceContext } from "./MySQLParser";
import { DropTriggerContext } from "./MySQLParser";
import { DropViewContext } from "./MySQLParser";
import { DropRoleContext } from "./MySQLParser";
import { DropSpatialReferenceContext } from "./MySQLParser";
import { DropUndoTablespaceContext } from "./MySQLParser";
import { RenameTableStatementContext } from "./MySQLParser";
import { RenamePairContext } from "./MySQLParser";
import { TruncateTableStatementContext } from "./MySQLParser";
import { ImportStatementContext } from "./MySQLParser";
import { CallStatementContext } from "./MySQLParser";
import { DeleteStatementContext } from "./MySQLParser";
import { PartitionDeleteContext } from "./MySQLParser";
import { DeleteStatementOptionContext } from "./MySQLParser";
import { DoStatementContext } from "./MySQLParser";
import { HandlerStatementContext } from "./MySQLParser";
import { HandlerReadOrScanContext } from "./MySQLParser";
import { InsertStatementContext } from "./MySQLParser";
import { InsertLockOptionContext } from "./MySQLParser";
import { InsertFromConstructorContext } from "./MySQLParser";
import { FieldsContext } from "./MySQLParser";
import { InsertValuesContext } from "./MySQLParser";
import { InsertQueryExpressionContext } from "./MySQLParser";
import { ValueListContext } from "./MySQLParser";
import { ValuesContext } from "./MySQLParser";
import { ValuesReferenceContext } from "./MySQLParser";
import { InsertUpdateListContext } from "./MySQLParser";
import { LoadStatementContext } from "./MySQLParser";
import { DataOrXmlContext } from "./MySQLParser";
import { XmlRowsIdentifiedByContext } from "./MySQLParser";
import { LoadDataFileTailContext } from "./MySQLParser";
import { LoadDataFileTargetListContext } from "./MySQLParser";
import { FieldOrVariableListContext } from "./MySQLParser";
import { ReplaceStatementContext } from "./MySQLParser";
import { SelectStatementContext } from "./MySQLParser";
import { SelectStatementWithIntoContext } from "./MySQLParser";
import { QueryExpressionContext } from "./MySQLParser";
import { QueryExpressionBodyContext } from "./MySQLParser";
import { QueryExpressionParensContext } from "./MySQLParser";
import { QuerySpecificationContext } from "./MySQLParser";
import { SubqueryContext } from "./MySQLParser";
import { QuerySpecOptionContext } from "./MySQLParser";
import { LimitClauseContext } from "./MySQLParser";
import { SimpleLimitClauseContext } from "./MySQLParser";
import { LimitOptionsContext } from "./MySQLParser";
import { LimitOptionContext } from "./MySQLParser";
import { IntoClauseContext } from "./MySQLParser";
import { ProcedureAnalyseClauseContext } from "./MySQLParser";
import { HavingClauseContext } from "./MySQLParser";
import { WindowClauseContext } from "./MySQLParser";
import { WindowDefinitionContext } from "./MySQLParser";
import { WindowSpecContext } from "./MySQLParser";
import { WindowSpecDetailsContext } from "./MySQLParser";
import { WindowFrameClauseContext } from "./MySQLParser";
import { WindowFrameUnitsContext } from "./MySQLParser";
import { WindowFrameExtentContext } from "./MySQLParser";
import { WindowFrameStartContext } from "./MySQLParser";
import { WindowFrameBetweenContext } from "./MySQLParser";
import { WindowFrameBoundContext } from "./MySQLParser";
import { WindowFrameExclusionContext } from "./MySQLParser";
import { WithClauseContext } from "./MySQLParser";
import { CommonTableExpressionContext } from "./MySQLParser";
import { GroupByClauseContext } from "./MySQLParser";
import { OlapOptionContext } from "./MySQLParser";
import { OrderClauseContext } from "./MySQLParser";
import { DirectionContext } from "./MySQLParser";
import { FromClauseContext } from "./MySQLParser";
import { TableReferenceListContext } from "./MySQLParser";
import { SelectOptionContext } from "./MySQLParser";
import { LockingClauseContext } from "./MySQLParser";
import { LockStrenghContext } from "./MySQLParser";
import { LockedRowActionContext } from "./MySQLParser";
import { SelectItemListContext } from "./MySQLParser";
import { SelectItemContext } from "./MySQLParser";
import { SelectAliasContext } from "./MySQLParser";
import { WhereClauseContext } from "./MySQLParser";
import { TableReferenceContext } from "./MySQLParser";
import { EscapedTableReferenceContext } from "./MySQLParser";
import { JoinedTableContext } from "./MySQLParser";
import { NaturalJoinTypeContext } from "./MySQLParser";
import { InnerJoinTypeContext } from "./MySQLParser";
import { OuterJoinTypeContext } from "./MySQLParser";
import { TableFactorContext } from "./MySQLParser";
import { SingleTableContext } from "./MySQLParser";
import { SingleTableParensContext } from "./MySQLParser";
import { DerivedTableContext } from "./MySQLParser";
import { TableReferenceListParensContext } from "./MySQLParser";
import { TableFunctionContext } from "./MySQLParser";
import { ColumnsClauseContext } from "./MySQLParser";
import { JtColumnContext } from "./MySQLParser";
import { OnEmptyOrErrorContext } from "./MySQLParser";
import { OnEmptyContext } from "./MySQLParser";
import { OnErrorContext } from "./MySQLParser";
import { JtOnResponseContext } from "./MySQLParser";
import { UnionOptionContext } from "./MySQLParser";
import { TableAliasContext } from "./MySQLParser";
import { IndexHintListContext } from "./MySQLParser";
import { IndexHintContext } from "./MySQLParser";
import { IndexHintTypeContext } from "./MySQLParser";
import { KeyOrIndexContext } from "./MySQLParser";
import { ConstraintKeyTypeContext } from "./MySQLParser";
import { IndexHintClauseContext } from "./MySQLParser";
import { IndexListContext } from "./MySQLParser";
import { IndexListElementContext } from "./MySQLParser";
import { UpdateStatementContext } from "./MySQLParser";
import { TransactionOrLockingStatementContext } from "./MySQLParser";
import { TransactionStatementContext } from "./MySQLParser";
import { BeginWorkContext } from "./MySQLParser";
import { TransactionCharacteristicContext } from "./MySQLParser";
import { SavepointStatementContext } from "./MySQLParser";
import { LockStatementContext } from "./MySQLParser";
import { LockItemContext } from "./MySQLParser";
import { LockOptionContext } from "./MySQLParser";
import { XaStatementContext } from "./MySQLParser";
import { XaConvertContext } from "./MySQLParser";
import { XidContext } from "./MySQLParser";
import { ReplicationStatementContext } from "./MySQLParser";
import { ResetOptionContext } from "./MySQLParser";
import { MasterResetOptionsContext } from "./MySQLParser";
import { ReplicationLoadContext } from "./MySQLParser";
import { ChangeMasterContext } from "./MySQLParser";
import { ChangeMasterOptionsContext } from "./MySQLParser";
import { MasterOptionContext } from "./MySQLParser";
import { PrivilegeCheckDefContext } from "./MySQLParser";
import { MasterTlsCiphersuitesDefContext } from "./MySQLParser";
import { MasterFileDefContext } from "./MySQLParser";
import { ServerIdListContext } from "./MySQLParser";
import { ChangeReplicationContext } from "./MySQLParser";
import { FilterDefinitionContext } from "./MySQLParser";
import { FilterDbListContext } from "./MySQLParser";
import { FilterTableListContext } from "./MySQLParser";
import { FilterStringListContext } from "./MySQLParser";
import { FilterWildDbTableStringContext } from "./MySQLParser";
import { FilterDbPairListContext } from "./MySQLParser";
import { SlaveContext } from "./MySQLParser";
import { SlaveUntilOptionsContext } from "./MySQLParser";
import { SlaveConnectionOptionsContext } from "./MySQLParser";
import { SlaveThreadOptionsContext } from "./MySQLParser";
import { SlaveThreadOptionContext } from "./MySQLParser";
import { GroupReplicationContext } from "./MySQLParser";
import { PreparedStatementContext } from "./MySQLParser";
import { ExecuteStatementContext } from "./MySQLParser";
import { ExecuteVarListContext } from "./MySQLParser";
import { CloneStatementContext } from "./MySQLParser";
import { DataDirSSLContext } from "./MySQLParser";
import { SslContext } from "./MySQLParser";
import { AccountManagementStatementContext } from "./MySQLParser";
import { AlterUserContext } from "./MySQLParser";
import { AlterUserTailContext } from "./MySQLParser";
import { UserFunctionContext } from "./MySQLParser";
import { CreateUserContext } from "./MySQLParser";
import { CreateUserTailContext } from "./MySQLParser";
import { DefaultRoleClauseContext } from "./MySQLParser";
import { RequireClauseContext } from "./MySQLParser";
import { ConnectOptionsContext } from "./MySQLParser";
import { AccountLockPasswordExpireOptionsContext } from "./MySQLParser";
import { DropUserContext } from "./MySQLParser";
import { GrantContext } from "./MySQLParser";
import { GrantTargetListContext } from "./MySQLParser";
import { GrantOptionsContext } from "./MySQLParser";
import { ExceptRoleListContext } from "./MySQLParser";
import { WithRolesContext } from "./MySQLParser";
import { GrantAsContext } from "./MySQLParser";
import { VersionedRequireClauseContext } from "./MySQLParser";
import { RenameUserContext } from "./MySQLParser";
import { RevokeContext } from "./MySQLParser";
import { OnTypeToContext } from "./MySQLParser";
import { AclTypeContext } from "./MySQLParser";
import { RoleOrPrivilegesListContext } from "./MySQLParser";
import { RoleOrPrivilegeContext } from "./MySQLParser";
import { GrantIdentifierContext } from "./MySQLParser";
import { RequireListContext } from "./MySQLParser";
import { RequireListElementContext } from "./MySQLParser";
import { GrantOptionContext } from "./MySQLParser";
import { SetRoleContext } from "./MySQLParser";
import { RoleListContext } from "./MySQLParser";
import { RoleContext } from "./MySQLParser";
import { TableAdministrationStatementContext } from "./MySQLParser";
import { HistogramContext } from "./MySQLParser";
import { CheckOptionContext } from "./MySQLParser";
import { RepairTypeContext } from "./MySQLParser";
import { InstallUninstallStatmentContext } from "./MySQLParser";
import { SetStatementContext } from "./MySQLParser";
import { StartOptionValueListContext } from "./MySQLParser";
import { TransactionCharacteristicsContext } from "./MySQLParser";
import { TransactionAccessModeContext } from "./MySQLParser";
import { IsolationLevelContext } from "./MySQLParser";
import { OptionValueListContinuedContext } from "./MySQLParser";
import { OptionValueNoOptionTypeContext } from "./MySQLParser";
import { OptionValueContext } from "./MySQLParser";
import { SetSystemVariableContext } from "./MySQLParser";
import { StartOptionValueListFollowingOptionTypeContext } from "./MySQLParser";
import { OptionValueFollowingOptionTypeContext } from "./MySQLParser";
import { SetExprOrDefaultContext } from "./MySQLParser";
import { ShowStatementContext } from "./MySQLParser";
import { ShowCommandTypeContext } from "./MySQLParser";
import { NonBlockingContext } from "./MySQLParser";
import { FromOrInContext } from "./MySQLParser";
import { InDbContext } from "./MySQLParser";
import { ProfileTypeContext } from "./MySQLParser";
import { OtherAdministrativeStatementContext } from "./MySQLParser";
import { KeyCacheListOrPartsContext } from "./MySQLParser";
import { KeyCacheListContext } from "./MySQLParser";
import { AssignToKeycacheContext } from "./MySQLParser";
import { AssignToKeycachePartitionContext } from "./MySQLParser";
import { CacheKeyListContext } from "./MySQLParser";
import { KeyUsageElementContext } from "./MySQLParser";
import { KeyUsageListContext } from "./MySQLParser";
import { FlushOptionContext } from "./MySQLParser";
import { LogTypeContext } from "./MySQLParser";
import { FlushTablesContext } from "./MySQLParser";
import { FlushTablesOptionsContext } from "./MySQLParser";
import { PreloadTailContext } from "./MySQLParser";
import { PreloadListContext } from "./MySQLParser";
import { PreloadKeysContext } from "./MySQLParser";
import { AdminPartitionContext } from "./MySQLParser";
import { ResourceGroupManagementContext } from "./MySQLParser";
import { CreateResourceGroupContext } from "./MySQLParser";
import { ResourceGroupVcpuListContext } from "./MySQLParser";
import { VcpuNumOrRangeContext } from "./MySQLParser";
import { ResourceGroupPriorityContext } from "./MySQLParser";
import { ResourceGroupEnableDisableContext } from "./MySQLParser";
import { AlterResourceGroupContext } from "./MySQLParser";
import { SetResourceGroupContext } from "./MySQLParser";
import { ThreadIdListContext } from "./MySQLParser";
import { DropResourceGroupContext } from "./MySQLParser";
import { UtilityStatementContext } from "./MySQLParser";
import { DescribeCommandContext } from "./MySQLParser";
import { ExplainCommandContext } from "./MySQLParser";
import { ExplainableStatementContext } from "./MySQLParser";
import { HelpCommandContext } from "./MySQLParser";
import { UseCommandContext } from "./MySQLParser";
import { RestartServerContext } from "./MySQLParser";
import { ExprContext } from "./MySQLParser";
import { BoolPriContext } from "./MySQLParser";
import { CompOpContext } from "./MySQLParser";
import { PredicateContext } from "./MySQLParser";
import { PredicateOperationsContext } from "./MySQLParser";
import { BitExprContext } from "./MySQLParser";
import { SimpleExprContext } from "./MySQLParser";
import { ArrayCastContext } from "./MySQLParser";
import { JsonOperatorContext } from "./MySQLParser";
import { SumExprContext } from "./MySQLParser";
import { GroupingOperationContext } from "./MySQLParser";
import { WindowFunctionCallContext } from "./MySQLParser";
import { WindowingClauseContext } from "./MySQLParser";
import { LeadLagInfoContext } from "./MySQLParser";
import { NullTreatmentContext } from "./MySQLParser";
import { JsonFunctionContext } from "./MySQLParser";
import { InSumExprContext } from "./MySQLParser";
import { IdentListArgContext } from "./MySQLParser";
import { IdentListContext } from "./MySQLParser";
import { FulltextOptionsContext } from "./MySQLParser";
import { RuntimeFunctionCallContext } from "./MySQLParser";
import { GeometryFunctionContext } from "./MySQLParser";
import { TimeFunctionParametersContext } from "./MySQLParser";
import { FractionalPrecisionContext } from "./MySQLParser";
import { WeightStringLevelsContext } from "./MySQLParser";
import { WeightStringLevelListItemContext } from "./MySQLParser";
import { DateTimeTtypeContext } from "./MySQLParser";
import { TrimFunctionContext } from "./MySQLParser";
import { SubstringFunctionContext } from "./MySQLParser";
import { FunctionCallContext } from "./MySQLParser";
import { UdfExprListContext } from "./MySQLParser";
import { UdfExprContext } from "./MySQLParser";
import { VariableContext } from "./MySQLParser";
import { UserVariableContext } from "./MySQLParser";
import { SystemVariableContext } from "./MySQLParser";
import { InternalVariableNameContext } from "./MySQLParser";
import { WhenExpressionContext } from "./MySQLParser";
import { ThenExpressionContext } from "./MySQLParser";
import { ElseExpressionContext } from "./MySQLParser";
import { CastTypeContext } from "./MySQLParser";
import { ExprListContext } from "./MySQLParser";
import { CharsetContext } from "./MySQLParser";
import { NotRuleContext } from "./MySQLParser";
import { Not2RuleContext } from "./MySQLParser";
import { IntervalContext } from "./MySQLParser";
import { IntervalTimeStampContext } from "./MySQLParser";
import { ExprListWithParenthesesContext } from "./MySQLParser";
import { ExprWithParenthesesContext } from "./MySQLParser";
import { SimpleExprWithParenthesesContext } from "./MySQLParser";
import { OrderListContext } from "./MySQLParser";
import { OrderExpressionContext } from "./MySQLParser";
import { GroupListContext } from "./MySQLParser";
import { GroupingExpressionContext } from "./MySQLParser";
import { ChannelContext } from "./MySQLParser";
import { CompoundStatementContext } from "./MySQLParser";
import { ReturnStatementContext } from "./MySQLParser";
import { IfStatementContext } from "./MySQLParser";
import { IfBodyContext } from "./MySQLParser";
import { ThenStatementContext } from "./MySQLParser";
import { CompoundStatementListContext } from "./MySQLParser";
import { CaseStatementContext } from "./MySQLParser";
import { ElseStatementContext } from "./MySQLParser";
import { LabeledBlockContext } from "./MySQLParser";
import { UnlabeledBlockContext } from "./MySQLParser";
import { LabelContext } from "./MySQLParser";
import { BeginEndBlockContext } from "./MySQLParser";
import { LabeledControlContext } from "./MySQLParser";
import { UnlabeledControlContext } from "./MySQLParser";
import { LoopBlockContext } from "./MySQLParser";
import { WhileDoBlockContext } from "./MySQLParser";
import { RepeatUntilBlockContext } from "./MySQLParser";
import { SpDeclarationsContext } from "./MySQLParser";
import { SpDeclarationContext } from "./MySQLParser";
import { VariableDeclarationContext } from "./MySQLParser";
import { ConditionDeclarationContext } from "./MySQLParser";
import { SpConditionContext } from "./MySQLParser";
import { SqlstateContext } from "./MySQLParser";
import { HandlerDeclarationContext } from "./MySQLParser";
import { HandlerConditionContext } from "./MySQLParser";
import { CursorDeclarationContext } from "./MySQLParser";
import { IterateStatementContext } from "./MySQLParser";
import { LeaveStatementContext } from "./MySQLParser";
import { GetDiagnosticsContext } from "./MySQLParser";
import { SignalAllowedExprContext } from "./MySQLParser";
import { StatementInformationItemContext } from "./MySQLParser";
import { ConditionInformationItemContext } from "./MySQLParser";
import { SignalInformationItemNameContext } from "./MySQLParser";
import { SignalStatementContext } from "./MySQLParser";
import { ResignalStatementContext } from "./MySQLParser";
import { SignalInformationItemContext } from "./MySQLParser";
import { CursorOpenContext } from "./MySQLParser";
import { CursorCloseContext } from "./MySQLParser";
import { CursorFetchContext } from "./MySQLParser";
import { ScheduleContext } from "./MySQLParser";
import { ColumnDefinitionContext } from "./MySQLParser";
import { CheckOrReferencesContext } from "./MySQLParser";
import { CheckConstraintContext } from "./MySQLParser";
import { ConstraintEnforcementContext } from "./MySQLParser";
import { TableConstraintDefContext } from "./MySQLParser";
import { ConstraintNameContext } from "./MySQLParser";
import { FieldDefinitionContext } from "./MySQLParser";
import { ColumnAttributeContext } from "./MySQLParser";
import { ColumnFormatContext } from "./MySQLParser";
import { StorageMediaContext } from "./MySQLParser";
import { GcolAttributeContext } from "./MySQLParser";
import { ReferencesContext } from "./MySQLParser";
import { DeleteOptionContext } from "./MySQLParser";
import { KeyListContext } from "./MySQLParser";
import { KeyPartContext } from "./MySQLParser";
import { KeyListWithExpressionContext } from "./MySQLParser";
import { KeyPartOrExpressionContext } from "./MySQLParser";
import { KeyListVariantsContext } from "./MySQLParser";
import { IndexTypeContext } from "./MySQLParser";
import { IndexOptionContext } from "./MySQLParser";
import { CommonIndexOptionContext } from "./MySQLParser";
import { VisibilityContext } from "./MySQLParser";
import { IndexTypeClauseContext } from "./MySQLParser";
import { FulltextIndexOptionContext } from "./MySQLParser";
import { SpatialIndexOptionContext } from "./MySQLParser";
import { DataTypeDefinitionContext } from "./MySQLParser";
import { DataTypeContext } from "./MySQLParser";
import { NcharContext } from "./MySQLParser";
import { RealTypeContext } from "./MySQLParser";
import { FieldLengthContext } from "./MySQLParser";
import { FieldOptionsContext } from "./MySQLParser";
import { CharsetWithOptBinaryContext } from "./MySQLParser";
import { AsciiContext } from "./MySQLParser";
import { UnicodeContext } from "./MySQLParser";
import { WsNumCodepointsContext } from "./MySQLParser";
import { TypeDatetimePrecisionContext } from "./MySQLParser";
import { CharsetNameContext } from "./MySQLParser";
import { CollationNameContext } from "./MySQLParser";
import { CreateTableOptionsContext } from "./MySQLParser";
import { CreateTableOptionsSpaceSeparatedContext } from "./MySQLParser";
import { CreateTableOptionContext } from "./MySQLParser";
import { TernaryOptionContext } from "./MySQLParser";
import { DefaultCollationContext } from "./MySQLParser";
import { DefaultEncryptionContext } from "./MySQLParser";
import { DefaultCharsetContext } from "./MySQLParser";
import { PartitionClauseContext } from "./MySQLParser";
import { PartitionTypeDefContext } from "./MySQLParser";
import { SubPartitionsContext } from "./MySQLParser";
import { PartitionKeyAlgorithmContext } from "./MySQLParser";
import { PartitionDefinitionsContext } from "./MySQLParser";
import { PartitionDefinitionContext } from "./MySQLParser";
import { PartitionValuesInContext } from "./MySQLParser";
import { PartitionOptionContext } from "./MySQLParser";
import { SubpartitionDefinitionContext } from "./MySQLParser";
import { PartitionValueItemListParenContext } from "./MySQLParser";
import { PartitionValueItemContext } from "./MySQLParser";
import { DefinerClauseContext } from "./MySQLParser";
import { IfExistsContext } from "./MySQLParser";
import { IfNotExistsContext } from "./MySQLParser";
import { ProcedureParameterContext } from "./MySQLParser";
import { FunctionParameterContext } from "./MySQLParser";
import { CollateContext } from "./MySQLParser";
import { TypeWithOptCollateContext } from "./MySQLParser";
import { SchemaIdentifierPairContext } from "./MySQLParser";
import { ViewRefListContext } from "./MySQLParser";
import { UpdateListContext } from "./MySQLParser";
import { UpdateElementContext } from "./MySQLParser";
import { CharsetClauseContext } from "./MySQLParser";
import { FieldsClauseContext } from "./MySQLParser";
import { FieldTermContext } from "./MySQLParser";
import { LinesClauseContext } from "./MySQLParser";
import { LineTermContext } from "./MySQLParser";
import { UserListContext } from "./MySQLParser";
import { CreateUserListContext } from "./MySQLParser";
import { AlterUserListContext } from "./MySQLParser";
import { CreateUserEntryContext } from "./MySQLParser";
import { AlterUserEntryContext } from "./MySQLParser";
import { RetainCurrentPasswordContext } from "./MySQLParser";
import { DiscardOldPasswordContext } from "./MySQLParser";
import { ReplacePasswordContext } from "./MySQLParser";
import { UserIdentifierOrTextContext } from "./MySQLParser";
import { UserContext } from "./MySQLParser";
import { LikeClauseContext } from "./MySQLParser";
import { LikeOrWhereContext } from "./MySQLParser";
import { OnlineOptionContext } from "./MySQLParser";
import { NoWriteToBinLogContext } from "./MySQLParser";
import { UsePartitionContext } from "./MySQLParser";
import { FieldIdentifierContext } from "./MySQLParser";
import { ColumnNameContext } from "./MySQLParser";
import { ColumnInternalRefContext } from "./MySQLParser";
import { ColumnInternalRefListContext } from "./MySQLParser";
import { ColumnRefContext } from "./MySQLParser";
import { InsertIdentifierContext } from "./MySQLParser";
import { IndexNameContext } from "./MySQLParser";
import { IndexRefContext } from "./MySQLParser";
import { TableWildContext } from "./MySQLParser";
import { SchemaNameContext } from "./MySQLParser";
import { SchemaRefContext } from "./MySQLParser";
import { ProcedureNameContext } from "./MySQLParser";
import { ProcedureRefContext } from "./MySQLParser";
import { FunctionNameContext } from "./MySQLParser";
import { FunctionRefContext } from "./MySQLParser";
import { TriggerNameContext } from "./MySQLParser";
import { TriggerRefContext } from "./MySQLParser";
import { ViewNameContext } from "./MySQLParser";
import { ViewRefContext } from "./MySQLParser";
import { TablespaceNameContext } from "./MySQLParser";
import { TablespaceRefContext } from "./MySQLParser";
import { LogfileGroupNameContext } from "./MySQLParser";
import { LogfileGroupRefContext } from "./MySQLParser";
import { EventNameContext } from "./MySQLParser";
import { EventRefContext } from "./MySQLParser";
import { UdfNameContext } from "./MySQLParser";
import { ServerNameContext } from "./MySQLParser";
import { ServerRefContext } from "./MySQLParser";
import { EngineRefContext } from "./MySQLParser";
import { TableNameContext } from "./MySQLParser";
import { FilterTableRefContext } from "./MySQLParser";
import { TableRefWithWildcardContext } from "./MySQLParser";
import { TableRefContext } from "./MySQLParser";
import { TableRefListContext } from "./MySQLParser";
import { TableAliasRefListContext } from "./MySQLParser";
import { ParameterNameContext } from "./MySQLParser";
import { LabelIdentifierContext } from "./MySQLParser";
import { LabelRefContext } from "./MySQLParser";
import { RoleIdentifierContext } from "./MySQLParser";
import { RoleRefContext } from "./MySQLParser";
import { PluginRefContext } from "./MySQLParser";
import { ComponentRefContext } from "./MySQLParser";
import { ResourceGroupRefContext } from "./MySQLParser";
import { WindowNameContext } from "./MySQLParser";
import { PureIdentifierContext } from "./MySQLParser";
import { IdentifierContext } from "./MySQLParser";
import { IdentifierListContext } from "./MySQLParser";
import { IdentifierListWithParenthesesContext } from "./MySQLParser";
import { QualifiedIdentifierContext } from "./MySQLParser";
import { SimpleIdentifierContext } from "./MySQLParser";
import { DotIdentifierContext } from "./MySQLParser";
import { Ulong_numberContext } from "./MySQLParser";
import { Real_ulong_numberContext } from "./MySQLParser";
import { Ulonglong_numberContext } from "./MySQLParser";
import { Real_ulonglong_numberContext } from "./MySQLParser";
import { LiteralContext } from "./MySQLParser";
import { SignedLiteralContext } from "./MySQLParser";
import { StringListContext } from "./MySQLParser";
import { TextStringLiteralContext } from "./MySQLParser";
import { TextStringContext } from "./MySQLParser";
import { TextStringHashContext } from "./MySQLParser";
import { TextLiteralContext } from "./MySQLParser";
import { TextStringNoLinebreakContext } from "./MySQLParser";
import { TextStringLiteralListContext } from "./MySQLParser";
import { NumLiteralContext } from "./MySQLParser";
import { BoolLiteralContext } from "./MySQLParser";
import { NullLiteralContext } from "./MySQLParser";
import { TemporalLiteralContext } from "./MySQLParser";
import { FloatOptionsContext } from "./MySQLParser";
import { StandardFloatOptionsContext } from "./MySQLParser";
import { PrecisionContext } from "./MySQLParser";
import { TextOrIdentifierContext } from "./MySQLParser";
import { LValueIdentifierContext } from "./MySQLParser";
import { RoleIdentifierOrTextContext } from "./MySQLParser";
import { SizeNumberContext } from "./MySQLParser";
import { ParenthesesContext } from "./MySQLParser";
import { EqualContext } from "./MySQLParser";
import { OptionTypeContext } from "./MySQLParser";
import { VarIdentTypeContext } from "./MySQLParser";
import { SetVarIdentTypeContext } from "./MySQLParser";
import { IdentifierKeywordContext } from "./MySQLParser";
import { IdentifierKeywordsAmbiguous1RolesAndLabelsContext } from "./MySQLParser";
import { IdentifierKeywordsAmbiguous2LabelsContext } from "./MySQLParser";
import { LabelKeywordContext } from "./MySQLParser";
import { IdentifierKeywordsAmbiguous3RolesContext } from "./MySQLParser";
import { IdentifierKeywordsUnambiguousContext } from "./MySQLParser";
import { RoleKeywordContext } from "./MySQLParser";
import { LValueKeywordContext } from "./MySQLParser";
import { IdentifierKeywordsAmbiguous4SystemVariablesContext } from "./MySQLParser";
import { RoleOrIdentifierKeywordContext } from "./MySQLParser";
import { RoleOrLabelKeywordContext } from "./MySQLParser";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `MySQLParser`.
 */
export interface MySQLParserListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by the `simpleExprVariable`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprVariable?: (ctx: SimpleExprVariableContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprVariable`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprVariable?: (ctx: SimpleExprVariableContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprColumnRef`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprColumnRef?: (ctx: SimpleExprColumnRefContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprColumnRef`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprColumnRef?: (ctx: SimpleExprColumnRefContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprRuntimeFunction`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprRuntimeFunction?: (ctx: SimpleExprRuntimeFunctionContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprRuntimeFunction`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprRuntimeFunction?: (ctx: SimpleExprRuntimeFunctionContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprFunction`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprFunction?: (ctx: SimpleExprFunctionContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprFunction`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprFunction?: (ctx: SimpleExprFunctionContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprCollate`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprCollate?: (ctx: SimpleExprCollateContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprCollate`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprCollate?: (ctx: SimpleExprCollateContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprLiteral`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprLiteral?: (ctx: SimpleExprLiteralContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprLiteral`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprLiteral?: (ctx: SimpleExprLiteralContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprParamMarker`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprParamMarker?: (ctx: SimpleExprParamMarkerContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprParamMarker`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprParamMarker?: (ctx: SimpleExprParamMarkerContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprSum`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprSum?: (ctx: SimpleExprSumContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprSum`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprSum?: (ctx: SimpleExprSumContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprGroupingOperation`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprGroupingOperation?: (ctx: SimpleExprGroupingOperationContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprGroupingOperation`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprGroupingOperation?: (ctx: SimpleExprGroupingOperationContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprWindowingFunction`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprWindowingFunction?: (ctx: SimpleExprWindowingFunctionContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprWindowingFunction`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprWindowingFunction?: (ctx: SimpleExprWindowingFunctionContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprConcat`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprConcat?: (ctx: SimpleExprConcatContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprConcat`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprConcat?: (ctx: SimpleExprConcatContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprUnary`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprUnary?: (ctx: SimpleExprUnaryContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprUnary`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprUnary?: (ctx: SimpleExprUnaryContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprNot`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprNot?: (ctx: SimpleExprNotContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprNot`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprNot?: (ctx: SimpleExprNotContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprList`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprList?: (ctx: SimpleExprListContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprList`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprList?: (ctx: SimpleExprListContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprSubQuery`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprSubQuery?: (ctx: SimpleExprSubQueryContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprSubQuery`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprSubQuery?: (ctx: SimpleExprSubQueryContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprOdbc`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprOdbc?: (ctx: SimpleExprOdbcContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprOdbc`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprOdbc?: (ctx: SimpleExprOdbcContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprMatch`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprMatch?: (ctx: SimpleExprMatchContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprMatch`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprMatch?: (ctx: SimpleExprMatchContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprBinary`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprBinary?: (ctx: SimpleExprBinaryContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprBinary`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprBinary?: (ctx: SimpleExprBinaryContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprCast`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprCast?: (ctx: SimpleExprCastContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprCast`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprCast?: (ctx: SimpleExprCastContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprCase`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprCase?: (ctx: SimpleExprCaseContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprCase`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprCase?: (ctx: SimpleExprCaseContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprConvert`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprConvert?: (ctx: SimpleExprConvertContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprConvert`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprConvert?: (ctx: SimpleExprConvertContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprConvertUsing`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprConvertUsing?: (ctx: SimpleExprConvertUsingContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprConvertUsing`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprConvertUsing?: (ctx: SimpleExprConvertUsingContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprDefault`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprDefault?: (ctx: SimpleExprDefaultContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprDefault`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprDefault?: (ctx: SimpleExprDefaultContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprValues`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprValues?: (ctx: SimpleExprValuesContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprValues`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprValues?: (ctx: SimpleExprValuesContext) => void;

	/**
	 * Enter a parse tree produced by the `simpleExprInterval`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprInterval?: (ctx: SimpleExprIntervalContext) => void;
	/**
	 * Exit a parse tree produced by the `simpleExprInterval`
	 * labeled alternative in `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprInterval?: (ctx: SimpleExprIntervalContext) => void;

	/**
	 * Enter a parse tree produced by the `primaryExprPredicate`
	 * labeled alternative in `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	enterPrimaryExprPredicate?: (ctx: PrimaryExprPredicateContext) => void;
	/**
	 * Exit a parse tree produced by the `primaryExprPredicate`
	 * labeled alternative in `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	exitPrimaryExprPredicate?: (ctx: PrimaryExprPredicateContext) => void;

	/**
	 * Enter a parse tree produced by the `primaryExprIsNull`
	 * labeled alternative in `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	enterPrimaryExprIsNull?: (ctx: PrimaryExprIsNullContext) => void;
	/**
	 * Exit a parse tree produced by the `primaryExprIsNull`
	 * labeled alternative in `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	exitPrimaryExprIsNull?: (ctx: PrimaryExprIsNullContext) => void;

	/**
	 * Enter a parse tree produced by the `primaryExprCompare`
	 * labeled alternative in `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	enterPrimaryExprCompare?: (ctx: PrimaryExprCompareContext) => void;
	/**
	 * Exit a parse tree produced by the `primaryExprCompare`
	 * labeled alternative in `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	exitPrimaryExprCompare?: (ctx: PrimaryExprCompareContext) => void;

	/**
	 * Enter a parse tree produced by the `primaryExprAllAny`
	 * labeled alternative in `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	enterPrimaryExprAllAny?: (ctx: PrimaryExprAllAnyContext) => void;
	/**
	 * Exit a parse tree produced by the `primaryExprAllAny`
	 * labeled alternative in `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	exitPrimaryExprAllAny?: (ctx: PrimaryExprAllAnyContext) => void;

	/**
	 * Enter a parse tree produced by the `predicateExprIn`
	 * labeled alternative in `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	enterPredicateExprIn?: (ctx: PredicateExprInContext) => void;
	/**
	 * Exit a parse tree produced by the `predicateExprIn`
	 * labeled alternative in `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	exitPredicateExprIn?: (ctx: PredicateExprInContext) => void;

	/**
	 * Enter a parse tree produced by the `predicateExprBetween`
	 * labeled alternative in `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	enterPredicateExprBetween?: (ctx: PredicateExprBetweenContext) => void;
	/**
	 * Exit a parse tree produced by the `predicateExprBetween`
	 * labeled alternative in `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	exitPredicateExprBetween?: (ctx: PredicateExprBetweenContext) => void;

	/**
	 * Enter a parse tree produced by the `predicateExprLike`
	 * labeled alternative in `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	enterPredicateExprLike?: (ctx: PredicateExprLikeContext) => void;
	/**
	 * Exit a parse tree produced by the `predicateExprLike`
	 * labeled alternative in `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	exitPredicateExprLike?: (ctx: PredicateExprLikeContext) => void;

	/**
	 * Enter a parse tree produced by the `predicateExprRegex`
	 * labeled alternative in `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	enterPredicateExprRegex?: (ctx: PredicateExprRegexContext) => void;
	/**
	 * Exit a parse tree produced by the `predicateExprRegex`
	 * labeled alternative in `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	exitPredicateExprRegex?: (ctx: PredicateExprRegexContext) => void;

	/**
	 * Enter a parse tree produced by the `exprIs`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	enterExprIs?: (ctx: ExprIsContext) => void;
	/**
	 * Exit a parse tree produced by the `exprIs`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	exitExprIs?: (ctx: ExprIsContext) => void;

	/**
	 * Enter a parse tree produced by the `exprNot`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	enterExprNot?: (ctx: ExprNotContext) => void;
	/**
	 * Exit a parse tree produced by the `exprNot`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	exitExprNot?: (ctx: ExprNotContext) => void;

	/**
	 * Enter a parse tree produced by the `exprAnd`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	enterExprAnd?: (ctx: ExprAndContext) => void;
	/**
	 * Exit a parse tree produced by the `exprAnd`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	exitExprAnd?: (ctx: ExprAndContext) => void;

	/**
	 * Enter a parse tree produced by the `exprXor`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	enterExprXor?: (ctx: ExprXorContext) => void;
	/**
	 * Exit a parse tree produced by the `exprXor`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	exitExprXor?: (ctx: ExprXorContext) => void;

	/**
	 * Enter a parse tree produced by the `exprOr`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	enterExprOr?: (ctx: ExprOrContext) => void;
	/**
	 * Exit a parse tree produced by the `exprOr`
	 * labeled alternative in `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	exitExprOr?: (ctx: ExprOrContext) => void;

	/**
	 * Enter a parse tree produced by the `partitionDefKey`
	 * labeled alternative in `MySQLParser.partitionTypeDef`.
	 * @param ctx the parse tree
	 */
	enterPartitionDefKey?: (ctx: PartitionDefKeyContext) => void;
	/**
	 * Exit a parse tree produced by the `partitionDefKey`
	 * labeled alternative in `MySQLParser.partitionTypeDef`.
	 * @param ctx the parse tree
	 */
	exitPartitionDefKey?: (ctx: PartitionDefKeyContext) => void;

	/**
	 * Enter a parse tree produced by the `partitionDefHash`
	 * labeled alternative in `MySQLParser.partitionTypeDef`.
	 * @param ctx the parse tree
	 */
	enterPartitionDefHash?: (ctx: PartitionDefHashContext) => void;
	/**
	 * Exit a parse tree produced by the `partitionDefHash`
	 * labeled alternative in `MySQLParser.partitionTypeDef`.
	 * @param ctx the parse tree
	 */
	exitPartitionDefHash?: (ctx: PartitionDefHashContext) => void;

	/**
	 * Enter a parse tree produced by the `partitionDefRangeList`
	 * labeled alternative in `MySQLParser.partitionTypeDef`.
	 * @param ctx the parse tree
	 */
	enterPartitionDefRangeList?: (ctx: PartitionDefRangeListContext) => void;
	/**
	 * Exit a parse tree produced by the `partitionDefRangeList`
	 * labeled alternative in `MySQLParser.partitionTypeDef`.
	 * @param ctx the parse tree
	 */
	exitPartitionDefRangeList?: (ctx: PartitionDefRangeListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.query`.
	 * @param ctx the parse tree
	 */
	enterQuery?: (ctx: QueryContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.query`.
	 * @param ctx the parse tree
	 */
	exitQuery?: (ctx: QueryContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.simpleStatement`.
	 * @param ctx the parse tree
	 */
	enterSimpleStatement?: (ctx: SimpleStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.simpleStatement`.
	 * @param ctx the parse tree
	 */
	exitSimpleStatement?: (ctx: SimpleStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterStatement`.
	 * @param ctx the parse tree
	 */
	enterAlterStatement?: (ctx: AlterStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterStatement`.
	 * @param ctx the parse tree
	 */
	exitAlterStatement?: (ctx: AlterStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterDatabase`.
	 * @param ctx the parse tree
	 */
	enterAlterDatabase?: (ctx: AlterDatabaseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterDatabase`.
	 * @param ctx the parse tree
	 */
	exitAlterDatabase?: (ctx: AlterDatabaseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterEvent`.
	 * @param ctx the parse tree
	 */
	enterAlterEvent?: (ctx: AlterEventContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterEvent`.
	 * @param ctx the parse tree
	 */
	exitAlterEvent?: (ctx: AlterEventContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterLogfileGroup`.
	 * @param ctx the parse tree
	 */
	enterAlterLogfileGroup?: (ctx: AlterLogfileGroupContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterLogfileGroup`.
	 * @param ctx the parse tree
	 */
	exitAlterLogfileGroup?: (ctx: AlterLogfileGroupContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterLogfileGroupOptions`.
	 * @param ctx the parse tree
	 */
	enterAlterLogfileGroupOptions?: (ctx: AlterLogfileGroupOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterLogfileGroupOptions`.
	 * @param ctx the parse tree
	 */
	exitAlterLogfileGroupOptions?: (ctx: AlterLogfileGroupOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterLogfileGroupOption`.
	 * @param ctx the parse tree
	 */
	enterAlterLogfileGroupOption?: (ctx: AlterLogfileGroupOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterLogfileGroupOption`.
	 * @param ctx the parse tree
	 */
	exitAlterLogfileGroupOption?: (ctx: AlterLogfileGroupOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterServer`.
	 * @param ctx the parse tree
	 */
	enterAlterServer?: (ctx: AlterServerContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterServer`.
	 * @param ctx the parse tree
	 */
	exitAlterServer?: (ctx: AlterServerContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterTable`.
	 * @param ctx the parse tree
	 */
	enterAlterTable?: (ctx: AlterTableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterTable`.
	 * @param ctx the parse tree
	 */
	exitAlterTable?: (ctx: AlterTableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterTableActions`.
	 * @param ctx the parse tree
	 */
	enterAlterTableActions?: (ctx: AlterTableActionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterTableActions`.
	 * @param ctx the parse tree
	 */
	exitAlterTableActions?: (ctx: AlterTableActionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterCommandList`.
	 * @param ctx the parse tree
	 */
	enterAlterCommandList?: (ctx: AlterCommandListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterCommandList`.
	 * @param ctx the parse tree
	 */
	exitAlterCommandList?: (ctx: AlterCommandListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterCommandsModifierList`.
	 * @param ctx the parse tree
	 */
	enterAlterCommandsModifierList?: (ctx: AlterCommandsModifierListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterCommandsModifierList`.
	 * @param ctx the parse tree
	 */
	exitAlterCommandsModifierList?: (ctx: AlterCommandsModifierListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.standaloneAlterCommands`.
	 * @param ctx the parse tree
	 */
	enterStandaloneAlterCommands?: (ctx: StandaloneAlterCommandsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.standaloneAlterCommands`.
	 * @param ctx the parse tree
	 */
	exitStandaloneAlterCommands?: (ctx: StandaloneAlterCommandsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterPartition`.
	 * @param ctx the parse tree
	 */
	enterAlterPartition?: (ctx: AlterPartitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterPartition`.
	 * @param ctx the parse tree
	 */
	exitAlterPartition?: (ctx: AlterPartitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterList`.
	 * @param ctx the parse tree
	 */
	enterAlterList?: (ctx: AlterListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterList`.
	 * @param ctx the parse tree
	 */
	exitAlterList?: (ctx: AlterListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterCommandsModifier`.
	 * @param ctx the parse tree
	 */
	enterAlterCommandsModifier?: (ctx: AlterCommandsModifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterCommandsModifier`.
	 * @param ctx the parse tree
	 */
	exitAlterCommandsModifier?: (ctx: AlterCommandsModifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterListItem`.
	 * @param ctx the parse tree
	 */
	enterAlterListItem?: (ctx: AlterListItemContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterListItem`.
	 * @param ctx the parse tree
	 */
	exitAlterListItem?: (ctx: AlterListItemContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.place`.
	 * @param ctx the parse tree
	 */
	enterPlace?: (ctx: PlaceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.place`.
	 * @param ctx the parse tree
	 */
	exitPlace?: (ctx: PlaceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.restrict`.
	 * @param ctx the parse tree
	 */
	enterRestrict?: (ctx: RestrictContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.restrict`.
	 * @param ctx the parse tree
	 */
	exitRestrict?: (ctx: RestrictContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterOrderList`.
	 * @param ctx the parse tree
	 */
	enterAlterOrderList?: (ctx: AlterOrderListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterOrderList`.
	 * @param ctx the parse tree
	 */
	exitAlterOrderList?: (ctx: AlterOrderListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterAlgorithmOption`.
	 * @param ctx the parse tree
	 */
	enterAlterAlgorithmOption?: (ctx: AlterAlgorithmOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterAlgorithmOption`.
	 * @param ctx the parse tree
	 */
	exitAlterAlgorithmOption?: (ctx: AlterAlgorithmOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterLockOption`.
	 * @param ctx the parse tree
	 */
	enterAlterLockOption?: (ctx: AlterLockOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterLockOption`.
	 * @param ctx the parse tree
	 */
	exitAlterLockOption?: (ctx: AlterLockOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexLockAndAlgorithm`.
	 * @param ctx the parse tree
	 */
	enterIndexLockAndAlgorithm?: (ctx: IndexLockAndAlgorithmContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexLockAndAlgorithm`.
	 * @param ctx the parse tree
	 */
	exitIndexLockAndAlgorithm?: (ctx: IndexLockAndAlgorithmContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.withValidation`.
	 * @param ctx the parse tree
	 */
	enterWithValidation?: (ctx: WithValidationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.withValidation`.
	 * @param ctx the parse tree
	 */
	exitWithValidation?: (ctx: WithValidationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.removePartitioning`.
	 * @param ctx the parse tree
	 */
	enterRemovePartitioning?: (ctx: RemovePartitioningContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.removePartitioning`.
	 * @param ctx the parse tree
	 */
	exitRemovePartitioning?: (ctx: RemovePartitioningContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.allOrPartitionNameList`.
	 * @param ctx the parse tree
	 */
	enterAllOrPartitionNameList?: (ctx: AllOrPartitionNameListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.allOrPartitionNameList`.
	 * @param ctx the parse tree
	 */
	exitAllOrPartitionNameList?: (ctx: AllOrPartitionNameListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.reorgPartitionRule`.
	 * @param ctx the parse tree
	 */
	enterReorgPartitionRule?: (ctx: ReorgPartitionRuleContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.reorgPartitionRule`.
	 * @param ctx the parse tree
	 */
	exitReorgPartitionRule?: (ctx: ReorgPartitionRuleContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterTablespace`.
	 * @param ctx the parse tree
	 */
	enterAlterTablespace?: (ctx: AlterTablespaceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterTablespace`.
	 * @param ctx the parse tree
	 */
	exitAlterTablespace?: (ctx: AlterTablespaceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterUndoTablespace`.
	 * @param ctx the parse tree
	 */
	enterAlterUndoTablespace?: (ctx: AlterUndoTablespaceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterUndoTablespace`.
	 * @param ctx the parse tree
	 */
	exitAlterUndoTablespace?: (ctx: AlterUndoTablespaceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.undoTableSpaceOptions`.
	 * @param ctx the parse tree
	 */
	enterUndoTableSpaceOptions?: (ctx: UndoTableSpaceOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.undoTableSpaceOptions`.
	 * @param ctx the parse tree
	 */
	exitUndoTableSpaceOptions?: (ctx: UndoTableSpaceOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.undoTableSpaceOption`.
	 * @param ctx the parse tree
	 */
	enterUndoTableSpaceOption?: (ctx: UndoTableSpaceOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.undoTableSpaceOption`.
	 * @param ctx the parse tree
	 */
	exitUndoTableSpaceOption?: (ctx: UndoTableSpaceOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterTablespaceOptions`.
	 * @param ctx the parse tree
	 */
	enterAlterTablespaceOptions?: (ctx: AlterTablespaceOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterTablespaceOptions`.
	 * @param ctx the parse tree
	 */
	exitAlterTablespaceOptions?: (ctx: AlterTablespaceOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterTablespaceOption`.
	 * @param ctx the parse tree
	 */
	enterAlterTablespaceOption?: (ctx: AlterTablespaceOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterTablespaceOption`.
	 * @param ctx the parse tree
	 */
	exitAlterTablespaceOption?: (ctx: AlterTablespaceOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.changeTablespaceOption`.
	 * @param ctx the parse tree
	 */
	enterChangeTablespaceOption?: (ctx: ChangeTablespaceOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.changeTablespaceOption`.
	 * @param ctx the parse tree
	 */
	exitChangeTablespaceOption?: (ctx: ChangeTablespaceOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterView`.
	 * @param ctx the parse tree
	 */
	enterAlterView?: (ctx: AlterViewContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterView`.
	 * @param ctx the parse tree
	 */
	exitAlterView?: (ctx: AlterViewContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.viewTail`.
	 * @param ctx the parse tree
	 */
	enterViewTail?: (ctx: ViewTailContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.viewTail`.
	 * @param ctx the parse tree
	 */
	exitViewTail?: (ctx: ViewTailContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.viewSelect`.
	 * @param ctx the parse tree
	 */
	enterViewSelect?: (ctx: ViewSelectContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.viewSelect`.
	 * @param ctx the parse tree
	 */
	exitViewSelect?: (ctx: ViewSelectContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.viewCheckOption`.
	 * @param ctx the parse tree
	 */
	enterViewCheckOption?: (ctx: ViewCheckOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.viewCheckOption`.
	 * @param ctx the parse tree
	 */
	exitViewCheckOption?: (ctx: ViewCheckOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createStatement`.
	 * @param ctx the parse tree
	 */
	enterCreateStatement?: (ctx: CreateStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createStatement`.
	 * @param ctx the parse tree
	 */
	exitCreateStatement?: (ctx: CreateStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createDatabase`.
	 * @param ctx the parse tree
	 */
	enterCreateDatabase?: (ctx: CreateDatabaseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createDatabase`.
	 * @param ctx the parse tree
	 */
	exitCreateDatabase?: (ctx: CreateDatabaseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createDatabaseOption`.
	 * @param ctx the parse tree
	 */
	enterCreateDatabaseOption?: (ctx: CreateDatabaseOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createDatabaseOption`.
	 * @param ctx the parse tree
	 */
	exitCreateDatabaseOption?: (ctx: CreateDatabaseOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createTable`.
	 * @param ctx the parse tree
	 */
	enterCreateTable?: (ctx: CreateTableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createTable`.
	 * @param ctx the parse tree
	 */
	exitCreateTable?: (ctx: CreateTableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableElementList`.
	 * @param ctx the parse tree
	 */
	enterTableElementList?: (ctx: TableElementListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableElementList`.
	 * @param ctx the parse tree
	 */
	exitTableElementList?: (ctx: TableElementListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableElement`.
	 * @param ctx the parse tree
	 */
	enterTableElement?: (ctx: TableElementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableElement`.
	 * @param ctx the parse tree
	 */
	exitTableElement?: (ctx: TableElementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.duplicateAsQueryExpression`.
	 * @param ctx the parse tree
	 */
	enterDuplicateAsQueryExpression?: (ctx: DuplicateAsQueryExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.duplicateAsQueryExpression`.
	 * @param ctx the parse tree
	 */
	exitDuplicateAsQueryExpression?: (ctx: DuplicateAsQueryExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.queryExpressionOrParens`.
	 * @param ctx the parse tree
	 */
	enterQueryExpressionOrParens?: (ctx: QueryExpressionOrParensContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.queryExpressionOrParens`.
	 * @param ctx the parse tree
	 */
	exitQueryExpressionOrParens?: (ctx: QueryExpressionOrParensContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createRoutine`.
	 * @param ctx the parse tree
	 */
	enterCreateRoutine?: (ctx: CreateRoutineContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createRoutine`.
	 * @param ctx the parse tree
	 */
	exitCreateRoutine?: (ctx: CreateRoutineContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createProcedure`.
	 * @param ctx the parse tree
	 */
	enterCreateProcedure?: (ctx: CreateProcedureContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createProcedure`.
	 * @param ctx the parse tree
	 */
	exitCreateProcedure?: (ctx: CreateProcedureContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createFunction`.
	 * @param ctx the parse tree
	 */
	enterCreateFunction?: (ctx: CreateFunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createFunction`.
	 * @param ctx the parse tree
	 */
	exitCreateFunction?: (ctx: CreateFunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createUdf`.
	 * @param ctx the parse tree
	 */
	enterCreateUdf?: (ctx: CreateUdfContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createUdf`.
	 * @param ctx the parse tree
	 */
	exitCreateUdf?: (ctx: CreateUdfContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.routineCreateOption`.
	 * @param ctx the parse tree
	 */
	enterRoutineCreateOption?: (ctx: RoutineCreateOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.routineCreateOption`.
	 * @param ctx the parse tree
	 */
	exitRoutineCreateOption?: (ctx: RoutineCreateOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.routineAlterOptions`.
	 * @param ctx the parse tree
	 */
	enterRoutineAlterOptions?: (ctx: RoutineAlterOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.routineAlterOptions`.
	 * @param ctx the parse tree
	 */
	exitRoutineAlterOptions?: (ctx: RoutineAlterOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.routineOption`.
	 * @param ctx the parse tree
	 */
	enterRoutineOption?: (ctx: RoutineOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.routineOption`.
	 * @param ctx the parse tree
	 */
	exitRoutineOption?: (ctx: RoutineOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createIndex`.
	 * @param ctx the parse tree
	 */
	enterCreateIndex?: (ctx: CreateIndexContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createIndex`.
	 * @param ctx the parse tree
	 */
	exitCreateIndex?: (ctx: CreateIndexContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexNameAndType`.
	 * @param ctx the parse tree
	 */
	enterIndexNameAndType?: (ctx: IndexNameAndTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexNameAndType`.
	 * @param ctx the parse tree
	 */
	exitIndexNameAndType?: (ctx: IndexNameAndTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createIndexTarget`.
	 * @param ctx the parse tree
	 */
	enterCreateIndexTarget?: (ctx: CreateIndexTargetContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createIndexTarget`.
	 * @param ctx the parse tree
	 */
	exitCreateIndexTarget?: (ctx: CreateIndexTargetContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createLogfileGroup`.
	 * @param ctx the parse tree
	 */
	enterCreateLogfileGroup?: (ctx: CreateLogfileGroupContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createLogfileGroup`.
	 * @param ctx the parse tree
	 */
	exitCreateLogfileGroup?: (ctx: CreateLogfileGroupContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.logfileGroupOptions`.
	 * @param ctx the parse tree
	 */
	enterLogfileGroupOptions?: (ctx: LogfileGroupOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.logfileGroupOptions`.
	 * @param ctx the parse tree
	 */
	exitLogfileGroupOptions?: (ctx: LogfileGroupOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.logfileGroupOption`.
	 * @param ctx the parse tree
	 */
	enterLogfileGroupOption?: (ctx: LogfileGroupOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.logfileGroupOption`.
	 * @param ctx the parse tree
	 */
	exitLogfileGroupOption?: (ctx: LogfileGroupOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createServer`.
	 * @param ctx the parse tree
	 */
	enterCreateServer?: (ctx: CreateServerContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createServer`.
	 * @param ctx the parse tree
	 */
	exitCreateServer?: (ctx: CreateServerContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.serverOptions`.
	 * @param ctx the parse tree
	 */
	enterServerOptions?: (ctx: ServerOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.serverOptions`.
	 * @param ctx the parse tree
	 */
	exitServerOptions?: (ctx: ServerOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.serverOption`.
	 * @param ctx the parse tree
	 */
	enterServerOption?: (ctx: ServerOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.serverOption`.
	 * @param ctx the parse tree
	 */
	exitServerOption?: (ctx: ServerOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createTablespace`.
	 * @param ctx the parse tree
	 */
	enterCreateTablespace?: (ctx: CreateTablespaceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createTablespace`.
	 * @param ctx the parse tree
	 */
	exitCreateTablespace?: (ctx: CreateTablespaceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createUndoTablespace`.
	 * @param ctx the parse tree
	 */
	enterCreateUndoTablespace?: (ctx: CreateUndoTablespaceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createUndoTablespace`.
	 * @param ctx the parse tree
	 */
	exitCreateUndoTablespace?: (ctx: CreateUndoTablespaceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsDataFileName`.
	 * @param ctx the parse tree
	 */
	enterTsDataFileName?: (ctx: TsDataFileNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsDataFileName`.
	 * @param ctx the parse tree
	 */
	exitTsDataFileName?: (ctx: TsDataFileNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsDataFile`.
	 * @param ctx the parse tree
	 */
	enterTsDataFile?: (ctx: TsDataFileContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsDataFile`.
	 * @param ctx the parse tree
	 */
	exitTsDataFile?: (ctx: TsDataFileContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tablespaceOptions`.
	 * @param ctx the parse tree
	 */
	enterTablespaceOptions?: (ctx: TablespaceOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tablespaceOptions`.
	 * @param ctx the parse tree
	 */
	exitTablespaceOptions?: (ctx: TablespaceOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tablespaceOption`.
	 * @param ctx the parse tree
	 */
	enterTablespaceOption?: (ctx: TablespaceOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tablespaceOption`.
	 * @param ctx the parse tree
	 */
	exitTablespaceOption?: (ctx: TablespaceOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionInitialSize`.
	 * @param ctx the parse tree
	 */
	enterTsOptionInitialSize?: (ctx: TsOptionInitialSizeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionInitialSize`.
	 * @param ctx the parse tree
	 */
	exitTsOptionInitialSize?: (ctx: TsOptionInitialSizeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionUndoRedoBufferSize`.
	 * @param ctx the parse tree
	 */
	enterTsOptionUndoRedoBufferSize?: (ctx: TsOptionUndoRedoBufferSizeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionUndoRedoBufferSize`.
	 * @param ctx the parse tree
	 */
	exitTsOptionUndoRedoBufferSize?: (ctx: TsOptionUndoRedoBufferSizeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionAutoextendSize`.
	 * @param ctx the parse tree
	 */
	enterTsOptionAutoextendSize?: (ctx: TsOptionAutoextendSizeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionAutoextendSize`.
	 * @param ctx the parse tree
	 */
	exitTsOptionAutoextendSize?: (ctx: TsOptionAutoextendSizeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionMaxSize`.
	 * @param ctx the parse tree
	 */
	enterTsOptionMaxSize?: (ctx: TsOptionMaxSizeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionMaxSize`.
	 * @param ctx the parse tree
	 */
	exitTsOptionMaxSize?: (ctx: TsOptionMaxSizeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionExtentSize`.
	 * @param ctx the parse tree
	 */
	enterTsOptionExtentSize?: (ctx: TsOptionExtentSizeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionExtentSize`.
	 * @param ctx the parse tree
	 */
	exitTsOptionExtentSize?: (ctx: TsOptionExtentSizeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionNodegroup`.
	 * @param ctx the parse tree
	 */
	enterTsOptionNodegroup?: (ctx: TsOptionNodegroupContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionNodegroup`.
	 * @param ctx the parse tree
	 */
	exitTsOptionNodegroup?: (ctx: TsOptionNodegroupContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionEngine`.
	 * @param ctx the parse tree
	 */
	enterTsOptionEngine?: (ctx: TsOptionEngineContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionEngine`.
	 * @param ctx the parse tree
	 */
	exitTsOptionEngine?: (ctx: TsOptionEngineContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionWait`.
	 * @param ctx the parse tree
	 */
	enterTsOptionWait?: (ctx: TsOptionWaitContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionWait`.
	 * @param ctx the parse tree
	 */
	exitTsOptionWait?: (ctx: TsOptionWaitContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionComment`.
	 * @param ctx the parse tree
	 */
	enterTsOptionComment?: (ctx: TsOptionCommentContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionComment`.
	 * @param ctx the parse tree
	 */
	exitTsOptionComment?: (ctx: TsOptionCommentContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionFileblockSize`.
	 * @param ctx the parse tree
	 */
	enterTsOptionFileblockSize?: (ctx: TsOptionFileblockSizeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionFileblockSize`.
	 * @param ctx the parse tree
	 */
	exitTsOptionFileblockSize?: (ctx: TsOptionFileblockSizeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tsOptionEncryption`.
	 * @param ctx the parse tree
	 */
	enterTsOptionEncryption?: (ctx: TsOptionEncryptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tsOptionEncryption`.
	 * @param ctx the parse tree
	 */
	exitTsOptionEncryption?: (ctx: TsOptionEncryptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createView`.
	 * @param ctx the parse tree
	 */
	enterCreateView?: (ctx: CreateViewContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createView`.
	 * @param ctx the parse tree
	 */
	exitCreateView?: (ctx: CreateViewContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.viewReplaceOrAlgorithm`.
	 * @param ctx the parse tree
	 */
	enterViewReplaceOrAlgorithm?: (ctx: ViewReplaceOrAlgorithmContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.viewReplaceOrAlgorithm`.
	 * @param ctx the parse tree
	 */
	exitViewReplaceOrAlgorithm?: (ctx: ViewReplaceOrAlgorithmContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.viewAlgorithm`.
	 * @param ctx the parse tree
	 */
	enterViewAlgorithm?: (ctx: ViewAlgorithmContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.viewAlgorithm`.
	 * @param ctx the parse tree
	 */
	exitViewAlgorithm?: (ctx: ViewAlgorithmContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.viewSuid`.
	 * @param ctx the parse tree
	 */
	enterViewSuid?: (ctx: ViewSuidContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.viewSuid`.
	 * @param ctx the parse tree
	 */
	exitViewSuid?: (ctx: ViewSuidContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createTrigger`.
	 * @param ctx the parse tree
	 */
	enterCreateTrigger?: (ctx: CreateTriggerContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createTrigger`.
	 * @param ctx the parse tree
	 */
	exitCreateTrigger?: (ctx: CreateTriggerContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.triggerFollowsPrecedesClause`.
	 * @param ctx the parse tree
	 */
	enterTriggerFollowsPrecedesClause?: (ctx: TriggerFollowsPrecedesClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.triggerFollowsPrecedesClause`.
	 * @param ctx the parse tree
	 */
	exitTriggerFollowsPrecedesClause?: (ctx: TriggerFollowsPrecedesClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createEvent`.
	 * @param ctx the parse tree
	 */
	enterCreateEvent?: (ctx: CreateEventContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createEvent`.
	 * @param ctx the parse tree
	 */
	exitCreateEvent?: (ctx: CreateEventContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createRole`.
	 * @param ctx the parse tree
	 */
	enterCreateRole?: (ctx: CreateRoleContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createRole`.
	 * @param ctx the parse tree
	 */
	exitCreateRole?: (ctx: CreateRoleContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createSpatialReference`.
	 * @param ctx the parse tree
	 */
	enterCreateSpatialReference?: (ctx: CreateSpatialReferenceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createSpatialReference`.
	 * @param ctx the parse tree
	 */
	exitCreateSpatialReference?: (ctx: CreateSpatialReferenceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.srsAttribute`.
	 * @param ctx the parse tree
	 */
	enterSrsAttribute?: (ctx: SrsAttributeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.srsAttribute`.
	 * @param ctx the parse tree
	 */
	exitSrsAttribute?: (ctx: SrsAttributeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropStatement`.
	 * @param ctx the parse tree
	 */
	enterDropStatement?: (ctx: DropStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropStatement`.
	 * @param ctx the parse tree
	 */
	exitDropStatement?: (ctx: DropStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropDatabase`.
	 * @param ctx the parse tree
	 */
	enterDropDatabase?: (ctx: DropDatabaseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropDatabase`.
	 * @param ctx the parse tree
	 */
	exitDropDatabase?: (ctx: DropDatabaseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropEvent`.
	 * @param ctx the parse tree
	 */
	enterDropEvent?: (ctx: DropEventContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropEvent`.
	 * @param ctx the parse tree
	 */
	exitDropEvent?: (ctx: DropEventContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropFunction`.
	 * @param ctx the parse tree
	 */
	enterDropFunction?: (ctx: DropFunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropFunction`.
	 * @param ctx the parse tree
	 */
	exitDropFunction?: (ctx: DropFunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropProcedure`.
	 * @param ctx the parse tree
	 */
	enterDropProcedure?: (ctx: DropProcedureContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropProcedure`.
	 * @param ctx the parse tree
	 */
	exitDropProcedure?: (ctx: DropProcedureContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropIndex`.
	 * @param ctx the parse tree
	 */
	enterDropIndex?: (ctx: DropIndexContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropIndex`.
	 * @param ctx the parse tree
	 */
	exitDropIndex?: (ctx: DropIndexContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropLogfileGroup`.
	 * @param ctx the parse tree
	 */
	enterDropLogfileGroup?: (ctx: DropLogfileGroupContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropLogfileGroup`.
	 * @param ctx the parse tree
	 */
	exitDropLogfileGroup?: (ctx: DropLogfileGroupContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropLogfileGroupOption`.
	 * @param ctx the parse tree
	 */
	enterDropLogfileGroupOption?: (ctx: DropLogfileGroupOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropLogfileGroupOption`.
	 * @param ctx the parse tree
	 */
	exitDropLogfileGroupOption?: (ctx: DropLogfileGroupOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropServer`.
	 * @param ctx the parse tree
	 */
	enterDropServer?: (ctx: DropServerContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropServer`.
	 * @param ctx the parse tree
	 */
	exitDropServer?: (ctx: DropServerContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropTable`.
	 * @param ctx the parse tree
	 */
	enterDropTable?: (ctx: DropTableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropTable`.
	 * @param ctx the parse tree
	 */
	exitDropTable?: (ctx: DropTableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropTableSpace`.
	 * @param ctx the parse tree
	 */
	enterDropTableSpace?: (ctx: DropTableSpaceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropTableSpace`.
	 * @param ctx the parse tree
	 */
	exitDropTableSpace?: (ctx: DropTableSpaceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropTrigger`.
	 * @param ctx the parse tree
	 */
	enterDropTrigger?: (ctx: DropTriggerContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropTrigger`.
	 * @param ctx the parse tree
	 */
	exitDropTrigger?: (ctx: DropTriggerContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropView`.
	 * @param ctx the parse tree
	 */
	enterDropView?: (ctx: DropViewContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropView`.
	 * @param ctx the parse tree
	 */
	exitDropView?: (ctx: DropViewContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropRole`.
	 * @param ctx the parse tree
	 */
	enterDropRole?: (ctx: DropRoleContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropRole`.
	 * @param ctx the parse tree
	 */
	exitDropRole?: (ctx: DropRoleContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropSpatialReference`.
	 * @param ctx the parse tree
	 */
	enterDropSpatialReference?: (ctx: DropSpatialReferenceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropSpatialReference`.
	 * @param ctx the parse tree
	 */
	exitDropSpatialReference?: (ctx: DropSpatialReferenceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropUndoTablespace`.
	 * @param ctx the parse tree
	 */
	enterDropUndoTablespace?: (ctx: DropUndoTablespaceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropUndoTablespace`.
	 * @param ctx the parse tree
	 */
	exitDropUndoTablespace?: (ctx: DropUndoTablespaceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.renameTableStatement`.
	 * @param ctx the parse tree
	 */
	enterRenameTableStatement?: (ctx: RenameTableStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.renameTableStatement`.
	 * @param ctx the parse tree
	 */
	exitRenameTableStatement?: (ctx: RenameTableStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.renamePair`.
	 * @param ctx the parse tree
	 */
	enterRenamePair?: (ctx: RenamePairContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.renamePair`.
	 * @param ctx the parse tree
	 */
	exitRenamePair?: (ctx: RenamePairContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.truncateTableStatement`.
	 * @param ctx the parse tree
	 */
	enterTruncateTableStatement?: (ctx: TruncateTableStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.truncateTableStatement`.
	 * @param ctx the parse tree
	 */
	exitTruncateTableStatement?: (ctx: TruncateTableStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.importStatement`.
	 * @param ctx the parse tree
	 */
	enterImportStatement?: (ctx: ImportStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.importStatement`.
	 * @param ctx the parse tree
	 */
	exitImportStatement?: (ctx: ImportStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.callStatement`.
	 * @param ctx the parse tree
	 */
	enterCallStatement?: (ctx: CallStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.callStatement`.
	 * @param ctx the parse tree
	 */
	exitCallStatement?: (ctx: CallStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.deleteStatement`.
	 * @param ctx the parse tree
	 */
	enterDeleteStatement?: (ctx: DeleteStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.deleteStatement`.
	 * @param ctx the parse tree
	 */
	exitDeleteStatement?: (ctx: DeleteStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionDelete`.
	 * @param ctx the parse tree
	 */
	enterPartitionDelete?: (ctx: PartitionDeleteContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionDelete`.
	 * @param ctx the parse tree
	 */
	exitPartitionDelete?: (ctx: PartitionDeleteContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.deleteStatementOption`.
	 * @param ctx the parse tree
	 */
	enterDeleteStatementOption?: (ctx: DeleteStatementOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.deleteStatementOption`.
	 * @param ctx the parse tree
	 */
	exitDeleteStatementOption?: (ctx: DeleteStatementOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.doStatement`.
	 * @param ctx the parse tree
	 */
	enterDoStatement?: (ctx: DoStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.doStatement`.
	 * @param ctx the parse tree
	 */
	exitDoStatement?: (ctx: DoStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.handlerStatement`.
	 * @param ctx the parse tree
	 */
	enterHandlerStatement?: (ctx: HandlerStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.handlerStatement`.
	 * @param ctx the parse tree
	 */
	exitHandlerStatement?: (ctx: HandlerStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.handlerReadOrScan`.
	 * @param ctx the parse tree
	 */
	enterHandlerReadOrScan?: (ctx: HandlerReadOrScanContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.handlerReadOrScan`.
	 * @param ctx the parse tree
	 */
	exitHandlerReadOrScan?: (ctx: HandlerReadOrScanContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.insertStatement`.
	 * @param ctx the parse tree
	 */
	enterInsertStatement?: (ctx: InsertStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.insertStatement`.
	 * @param ctx the parse tree
	 */
	exitInsertStatement?: (ctx: InsertStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.insertLockOption`.
	 * @param ctx the parse tree
	 */
	enterInsertLockOption?: (ctx: InsertLockOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.insertLockOption`.
	 * @param ctx the parse tree
	 */
	exitInsertLockOption?: (ctx: InsertLockOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.insertFromConstructor`.
	 * @param ctx the parse tree
	 */
	enterInsertFromConstructor?: (ctx: InsertFromConstructorContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.insertFromConstructor`.
	 * @param ctx the parse tree
	 */
	exitInsertFromConstructor?: (ctx: InsertFromConstructorContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fields`.
	 * @param ctx the parse tree
	 */
	enterFields?: (ctx: FieldsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fields`.
	 * @param ctx the parse tree
	 */
	exitFields?: (ctx: FieldsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.insertValues`.
	 * @param ctx the parse tree
	 */
	enterInsertValues?: (ctx: InsertValuesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.insertValues`.
	 * @param ctx the parse tree
	 */
	exitInsertValues?: (ctx: InsertValuesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.insertQueryExpression`.
	 * @param ctx the parse tree
	 */
	enterInsertQueryExpression?: (ctx: InsertQueryExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.insertQueryExpression`.
	 * @param ctx the parse tree
	 */
	exitInsertQueryExpression?: (ctx: InsertQueryExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.valueList`.
	 * @param ctx the parse tree
	 */
	enterValueList?: (ctx: ValueListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.valueList`.
	 * @param ctx the parse tree
	 */
	exitValueList?: (ctx: ValueListContext) => void;

	/**
	 * Enter a parse tree produced by the `values`
	 * labeled alternative in `MySQLParser.exprexprexprexprexprboolPriboolPriboolPriboolPripredicateOperationspredicateOperationspredicateOperationspredicateOperationssimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprpartitionTypeDefpartitionTypeDefpartitionTypeDef`.
	 * @param ctx the parse tree
	 */
	enterValues?: (ctx: ValuesContext) => void;
	/**
	 * Exit a parse tree produced by the `values`
	 * labeled alternative in `MySQLParser.exprexprexprexprexprboolPriboolPriboolPriboolPripredicateOperationspredicateOperationspredicateOperationspredicateOperationssimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprsimpleExprpartitionTypeDefpartitionTypeDefpartitionTypeDef`.
	 * @param ctx the parse tree
	 */
	exitValues?: (ctx: ValuesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.valuesReference`.
	 * @param ctx the parse tree
	 */
	enterValuesReference?: (ctx: ValuesReferenceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.valuesReference`.
	 * @param ctx the parse tree
	 */
	exitValuesReference?: (ctx: ValuesReferenceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.insertUpdateList`.
	 * @param ctx the parse tree
	 */
	enterInsertUpdateList?: (ctx: InsertUpdateListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.insertUpdateList`.
	 * @param ctx the parse tree
	 */
	exitInsertUpdateList?: (ctx: InsertUpdateListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.loadStatement`.
	 * @param ctx the parse tree
	 */
	enterLoadStatement?: (ctx: LoadStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.loadStatement`.
	 * @param ctx the parse tree
	 */
	exitLoadStatement?: (ctx: LoadStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dataOrXml`.
	 * @param ctx the parse tree
	 */
	enterDataOrXml?: (ctx: DataOrXmlContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dataOrXml`.
	 * @param ctx the parse tree
	 */
	exitDataOrXml?: (ctx: DataOrXmlContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.xmlRowsIdentifiedBy`.
	 * @param ctx the parse tree
	 */
	enterXmlRowsIdentifiedBy?: (ctx: XmlRowsIdentifiedByContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.xmlRowsIdentifiedBy`.
	 * @param ctx the parse tree
	 */
	exitXmlRowsIdentifiedBy?: (ctx: XmlRowsIdentifiedByContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.loadDataFileTail`.
	 * @param ctx the parse tree
	 */
	enterLoadDataFileTail?: (ctx: LoadDataFileTailContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.loadDataFileTail`.
	 * @param ctx the parse tree
	 */
	exitLoadDataFileTail?: (ctx: LoadDataFileTailContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.loadDataFileTargetList`.
	 * @param ctx the parse tree
	 */
	enterLoadDataFileTargetList?: (ctx: LoadDataFileTargetListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.loadDataFileTargetList`.
	 * @param ctx the parse tree
	 */
	exitLoadDataFileTargetList?: (ctx: LoadDataFileTargetListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fieldOrVariableList`.
	 * @param ctx the parse tree
	 */
	enterFieldOrVariableList?: (ctx: FieldOrVariableListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fieldOrVariableList`.
	 * @param ctx the parse tree
	 */
	exitFieldOrVariableList?: (ctx: FieldOrVariableListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.replaceStatement`.
	 * @param ctx the parse tree
	 */
	enterReplaceStatement?: (ctx: ReplaceStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.replaceStatement`.
	 * @param ctx the parse tree
	 */
	exitReplaceStatement?: (ctx: ReplaceStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.selectStatement`.
	 * @param ctx the parse tree
	 */
	enterSelectStatement?: (ctx: SelectStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.selectStatement`.
	 * @param ctx the parse tree
	 */
	exitSelectStatement?: (ctx: SelectStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.selectStatementWithInto`.
	 * @param ctx the parse tree
	 */
	enterSelectStatementWithInto?: (ctx: SelectStatementWithIntoContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.selectStatementWithInto`.
	 * @param ctx the parse tree
	 */
	exitSelectStatementWithInto?: (ctx: SelectStatementWithIntoContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.queryExpression`.
	 * @param ctx the parse tree
	 */
	enterQueryExpression?: (ctx: QueryExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.queryExpression`.
	 * @param ctx the parse tree
	 */
	exitQueryExpression?: (ctx: QueryExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.queryExpressionBody`.
	 * @param ctx the parse tree
	 */
	enterQueryExpressionBody?: (ctx: QueryExpressionBodyContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.queryExpressionBody`.
	 * @param ctx the parse tree
	 */
	exitQueryExpressionBody?: (ctx: QueryExpressionBodyContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.queryExpressionParens`.
	 * @param ctx the parse tree
	 */
	enterQueryExpressionParens?: (ctx: QueryExpressionParensContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.queryExpressionParens`.
	 * @param ctx the parse tree
	 */
	exitQueryExpressionParens?: (ctx: QueryExpressionParensContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.querySpecification`.
	 * @param ctx the parse tree
	 */
	enterQuerySpecification?: (ctx: QuerySpecificationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.querySpecification`.
	 * @param ctx the parse tree
	 */
	exitQuerySpecification?: (ctx: QuerySpecificationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.subquery`.
	 * @param ctx the parse tree
	 */
	enterSubquery?: (ctx: SubqueryContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.subquery`.
	 * @param ctx the parse tree
	 */
	exitSubquery?: (ctx: SubqueryContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.querySpecOption`.
	 * @param ctx the parse tree
	 */
	enterQuerySpecOption?: (ctx: QuerySpecOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.querySpecOption`.
	 * @param ctx the parse tree
	 */
	exitQuerySpecOption?: (ctx: QuerySpecOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.limitClause`.
	 * @param ctx the parse tree
	 */
	enterLimitClause?: (ctx: LimitClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.limitClause`.
	 * @param ctx the parse tree
	 */
	exitLimitClause?: (ctx: LimitClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.simpleLimitClause`.
	 * @param ctx the parse tree
	 */
	enterSimpleLimitClause?: (ctx: SimpleLimitClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.simpleLimitClause`.
	 * @param ctx the parse tree
	 */
	exitSimpleLimitClause?: (ctx: SimpleLimitClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.limitOptions`.
	 * @param ctx the parse tree
	 */
	enterLimitOptions?: (ctx: LimitOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.limitOptions`.
	 * @param ctx the parse tree
	 */
	exitLimitOptions?: (ctx: LimitOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.limitOption`.
	 * @param ctx the parse tree
	 */
	enterLimitOption?: (ctx: LimitOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.limitOption`.
	 * @param ctx the parse tree
	 */
	exitLimitOption?: (ctx: LimitOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.intoClause`.
	 * @param ctx the parse tree
	 */
	enterIntoClause?: (ctx: IntoClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.intoClause`.
	 * @param ctx the parse tree
	 */
	exitIntoClause?: (ctx: IntoClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.procedureAnalyseClause`.
	 * @param ctx the parse tree
	 */
	enterProcedureAnalyseClause?: (ctx: ProcedureAnalyseClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.procedureAnalyseClause`.
	 * @param ctx the parse tree
	 */
	exitProcedureAnalyseClause?: (ctx: ProcedureAnalyseClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.havingClause`.
	 * @param ctx the parse tree
	 */
	enterHavingClause?: (ctx: HavingClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.havingClause`.
	 * @param ctx the parse tree
	 */
	exitHavingClause?: (ctx: HavingClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowClause`.
	 * @param ctx the parse tree
	 */
	enterWindowClause?: (ctx: WindowClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowClause`.
	 * @param ctx the parse tree
	 */
	exitWindowClause?: (ctx: WindowClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowDefinition`.
	 * @param ctx the parse tree
	 */
	enterWindowDefinition?: (ctx: WindowDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowDefinition`.
	 * @param ctx the parse tree
	 */
	exitWindowDefinition?: (ctx: WindowDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowSpec`.
	 * @param ctx the parse tree
	 */
	enterWindowSpec?: (ctx: WindowSpecContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowSpec`.
	 * @param ctx the parse tree
	 */
	exitWindowSpec?: (ctx: WindowSpecContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowSpecDetails`.
	 * @param ctx the parse tree
	 */
	enterWindowSpecDetails?: (ctx: WindowSpecDetailsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowSpecDetails`.
	 * @param ctx the parse tree
	 */
	exitWindowSpecDetails?: (ctx: WindowSpecDetailsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowFrameClause`.
	 * @param ctx the parse tree
	 */
	enterWindowFrameClause?: (ctx: WindowFrameClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowFrameClause`.
	 * @param ctx the parse tree
	 */
	exitWindowFrameClause?: (ctx: WindowFrameClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowFrameUnits`.
	 * @param ctx the parse tree
	 */
	enterWindowFrameUnits?: (ctx: WindowFrameUnitsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowFrameUnits`.
	 * @param ctx the parse tree
	 */
	exitWindowFrameUnits?: (ctx: WindowFrameUnitsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowFrameExtent`.
	 * @param ctx the parse tree
	 */
	enterWindowFrameExtent?: (ctx: WindowFrameExtentContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowFrameExtent`.
	 * @param ctx the parse tree
	 */
	exitWindowFrameExtent?: (ctx: WindowFrameExtentContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowFrameStart`.
	 * @param ctx the parse tree
	 */
	enterWindowFrameStart?: (ctx: WindowFrameStartContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowFrameStart`.
	 * @param ctx the parse tree
	 */
	exitWindowFrameStart?: (ctx: WindowFrameStartContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowFrameBetween`.
	 * @param ctx the parse tree
	 */
	enterWindowFrameBetween?: (ctx: WindowFrameBetweenContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowFrameBetween`.
	 * @param ctx the parse tree
	 */
	exitWindowFrameBetween?: (ctx: WindowFrameBetweenContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowFrameBound`.
	 * @param ctx the parse tree
	 */
	enterWindowFrameBound?: (ctx: WindowFrameBoundContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowFrameBound`.
	 * @param ctx the parse tree
	 */
	exitWindowFrameBound?: (ctx: WindowFrameBoundContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowFrameExclusion`.
	 * @param ctx the parse tree
	 */
	enterWindowFrameExclusion?: (ctx: WindowFrameExclusionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowFrameExclusion`.
	 * @param ctx the parse tree
	 */
	exitWindowFrameExclusion?: (ctx: WindowFrameExclusionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.withClause`.
	 * @param ctx the parse tree
	 */
	enterWithClause?: (ctx: WithClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.withClause`.
	 * @param ctx the parse tree
	 */
	exitWithClause?: (ctx: WithClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.commonTableExpression`.
	 * @param ctx the parse tree
	 */
	enterCommonTableExpression?: (ctx: CommonTableExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.commonTableExpression`.
	 * @param ctx the parse tree
	 */
	exitCommonTableExpression?: (ctx: CommonTableExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.groupByClause`.
	 * @param ctx the parse tree
	 */
	enterGroupByClause?: (ctx: GroupByClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.groupByClause`.
	 * @param ctx the parse tree
	 */
	exitGroupByClause?: (ctx: GroupByClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.olapOption`.
	 * @param ctx the parse tree
	 */
	enterOlapOption?: (ctx: OlapOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.olapOption`.
	 * @param ctx the parse tree
	 */
	exitOlapOption?: (ctx: OlapOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.orderClause`.
	 * @param ctx the parse tree
	 */
	enterOrderClause?: (ctx: OrderClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.orderClause`.
	 * @param ctx the parse tree
	 */
	exitOrderClause?: (ctx: OrderClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.direction`.
	 * @param ctx the parse tree
	 */
	enterDirection?: (ctx: DirectionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.direction`.
	 * @param ctx the parse tree
	 */
	exitDirection?: (ctx: DirectionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fromClause`.
	 * @param ctx the parse tree
	 */
	enterFromClause?: (ctx: FromClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fromClause`.
	 * @param ctx the parse tree
	 */
	exitFromClause?: (ctx: FromClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableReferenceList`.
	 * @param ctx the parse tree
	 */
	enterTableReferenceList?: (ctx: TableReferenceListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableReferenceList`.
	 * @param ctx the parse tree
	 */
	exitTableReferenceList?: (ctx: TableReferenceListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.selectOption`.
	 * @param ctx the parse tree
	 */
	enterSelectOption?: (ctx: SelectOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.selectOption`.
	 * @param ctx the parse tree
	 */
	exitSelectOption?: (ctx: SelectOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.lockingClause`.
	 * @param ctx the parse tree
	 */
	enterLockingClause?: (ctx: LockingClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.lockingClause`.
	 * @param ctx the parse tree
	 */
	exitLockingClause?: (ctx: LockingClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.lockStrengh`.
	 * @param ctx the parse tree
	 */
	enterLockStrengh?: (ctx: LockStrenghContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.lockStrengh`.
	 * @param ctx the parse tree
	 */
	exitLockStrengh?: (ctx: LockStrenghContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.lockedRowAction`.
	 * @param ctx the parse tree
	 */
	enterLockedRowAction?: (ctx: LockedRowActionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.lockedRowAction`.
	 * @param ctx the parse tree
	 */
	exitLockedRowAction?: (ctx: LockedRowActionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.selectItemList`.
	 * @param ctx the parse tree
	 */
	enterSelectItemList?: (ctx: SelectItemListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.selectItemList`.
	 * @param ctx the parse tree
	 */
	exitSelectItemList?: (ctx: SelectItemListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.selectItem`.
	 * @param ctx the parse tree
	 */
	enterSelectItem?: (ctx: SelectItemContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.selectItem`.
	 * @param ctx the parse tree
	 */
	exitSelectItem?: (ctx: SelectItemContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.selectAlias`.
	 * @param ctx the parse tree
	 */
	enterSelectAlias?: (ctx: SelectAliasContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.selectAlias`.
	 * @param ctx the parse tree
	 */
	exitSelectAlias?: (ctx: SelectAliasContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.whereClause`.
	 * @param ctx the parse tree
	 */
	enterWhereClause?: (ctx: WhereClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.whereClause`.
	 * @param ctx the parse tree
	 */
	exitWhereClause?: (ctx: WhereClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableReference`.
	 * @param ctx the parse tree
	 */
	enterTableReference?: (ctx: TableReferenceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableReference`.
	 * @param ctx the parse tree
	 */
	exitTableReference?: (ctx: TableReferenceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.escapedTableReference`.
	 * @param ctx the parse tree
	 */
	enterEscapedTableReference?: (ctx: EscapedTableReferenceContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.escapedTableReference`.
	 * @param ctx the parse tree
	 */
	exitEscapedTableReference?: (ctx: EscapedTableReferenceContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.joinedTable`.
	 * @param ctx the parse tree
	 */
	enterJoinedTable?: (ctx: JoinedTableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.joinedTable`.
	 * @param ctx the parse tree
	 */
	exitJoinedTable?: (ctx: JoinedTableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.naturalJoinType`.
	 * @param ctx the parse tree
	 */
	enterNaturalJoinType?: (ctx: NaturalJoinTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.naturalJoinType`.
	 * @param ctx the parse tree
	 */
	exitNaturalJoinType?: (ctx: NaturalJoinTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.innerJoinType`.
	 * @param ctx the parse tree
	 */
	enterInnerJoinType?: (ctx: InnerJoinTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.innerJoinType`.
	 * @param ctx the parse tree
	 */
	exitInnerJoinType?: (ctx: InnerJoinTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.outerJoinType`.
	 * @param ctx the parse tree
	 */
	enterOuterJoinType?: (ctx: OuterJoinTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.outerJoinType`.
	 * @param ctx the parse tree
	 */
	exitOuterJoinType?: (ctx: OuterJoinTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableFactor`.
	 * @param ctx the parse tree
	 */
	enterTableFactor?: (ctx: TableFactorContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableFactor`.
	 * @param ctx the parse tree
	 */
	exitTableFactor?: (ctx: TableFactorContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.singleTable`.
	 * @param ctx the parse tree
	 */
	enterSingleTable?: (ctx: SingleTableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.singleTable`.
	 * @param ctx the parse tree
	 */
	exitSingleTable?: (ctx: SingleTableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.singleTableParens`.
	 * @param ctx the parse tree
	 */
	enterSingleTableParens?: (ctx: SingleTableParensContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.singleTableParens`.
	 * @param ctx the parse tree
	 */
	exitSingleTableParens?: (ctx: SingleTableParensContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.derivedTable`.
	 * @param ctx the parse tree
	 */
	enterDerivedTable?: (ctx: DerivedTableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.derivedTable`.
	 * @param ctx the parse tree
	 */
	exitDerivedTable?: (ctx: DerivedTableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableReferenceListParens`.
	 * @param ctx the parse tree
	 */
	enterTableReferenceListParens?: (ctx: TableReferenceListParensContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableReferenceListParens`.
	 * @param ctx the parse tree
	 */
	exitTableReferenceListParens?: (ctx: TableReferenceListParensContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableFunction`.
	 * @param ctx the parse tree
	 */
	enterTableFunction?: (ctx: TableFunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableFunction`.
	 * @param ctx the parse tree
	 */
	exitTableFunction?: (ctx: TableFunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.columnsClause`.
	 * @param ctx the parse tree
	 */
	enterColumnsClause?: (ctx: ColumnsClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.columnsClause`.
	 * @param ctx the parse tree
	 */
	exitColumnsClause?: (ctx: ColumnsClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.jtColumn`.
	 * @param ctx the parse tree
	 */
	enterJtColumn?: (ctx: JtColumnContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.jtColumn`.
	 * @param ctx the parse tree
	 */
	exitJtColumn?: (ctx: JtColumnContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.onEmptyOrError`.
	 * @param ctx the parse tree
	 */
	enterOnEmptyOrError?: (ctx: OnEmptyOrErrorContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.onEmptyOrError`.
	 * @param ctx the parse tree
	 */
	exitOnEmptyOrError?: (ctx: OnEmptyOrErrorContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.onEmpty`.
	 * @param ctx the parse tree
	 */
	enterOnEmpty?: (ctx: OnEmptyContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.onEmpty`.
	 * @param ctx the parse tree
	 */
	exitOnEmpty?: (ctx: OnEmptyContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.onError`.
	 * @param ctx the parse tree
	 */
	enterOnError?: (ctx: OnErrorContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.onError`.
	 * @param ctx the parse tree
	 */
	exitOnError?: (ctx: OnErrorContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.jtOnResponse`.
	 * @param ctx the parse tree
	 */
	enterJtOnResponse?: (ctx: JtOnResponseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.jtOnResponse`.
	 * @param ctx the parse tree
	 */
	exitJtOnResponse?: (ctx: JtOnResponseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.unionOption`.
	 * @param ctx the parse tree
	 */
	enterUnionOption?: (ctx: UnionOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.unionOption`.
	 * @param ctx the parse tree
	 */
	exitUnionOption?: (ctx: UnionOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableAlias`.
	 * @param ctx the parse tree
	 */
	enterTableAlias?: (ctx: TableAliasContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableAlias`.
	 * @param ctx the parse tree
	 */
	exitTableAlias?: (ctx: TableAliasContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexHintList`.
	 * @param ctx the parse tree
	 */
	enterIndexHintList?: (ctx: IndexHintListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexHintList`.
	 * @param ctx the parse tree
	 */
	exitIndexHintList?: (ctx: IndexHintListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexHint`.
	 * @param ctx the parse tree
	 */
	enterIndexHint?: (ctx: IndexHintContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexHint`.
	 * @param ctx the parse tree
	 */
	exitIndexHint?: (ctx: IndexHintContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexHintType`.
	 * @param ctx the parse tree
	 */
	enterIndexHintType?: (ctx: IndexHintTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexHintType`.
	 * @param ctx the parse tree
	 */
	exitIndexHintType?: (ctx: IndexHintTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyOrIndex`.
	 * @param ctx the parse tree
	 */
	enterKeyOrIndex?: (ctx: KeyOrIndexContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyOrIndex`.
	 * @param ctx the parse tree
	 */
	exitKeyOrIndex?: (ctx: KeyOrIndexContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.constraintKeyType`.
	 * @param ctx the parse tree
	 */
	enterConstraintKeyType?: (ctx: ConstraintKeyTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.constraintKeyType`.
	 * @param ctx the parse tree
	 */
	exitConstraintKeyType?: (ctx: ConstraintKeyTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexHintClause`.
	 * @param ctx the parse tree
	 */
	enterIndexHintClause?: (ctx: IndexHintClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexHintClause`.
	 * @param ctx the parse tree
	 */
	exitIndexHintClause?: (ctx: IndexHintClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexList`.
	 * @param ctx the parse tree
	 */
	enterIndexList?: (ctx: IndexListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexList`.
	 * @param ctx the parse tree
	 */
	exitIndexList?: (ctx: IndexListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexListElement`.
	 * @param ctx the parse tree
	 */
	enterIndexListElement?: (ctx: IndexListElementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexListElement`.
	 * @param ctx the parse tree
	 */
	exitIndexListElement?: (ctx: IndexListElementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.updateStatement`.
	 * @param ctx the parse tree
	 */
	enterUpdateStatement?: (ctx: UpdateStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.updateStatement`.
	 * @param ctx the parse tree
	 */
	exitUpdateStatement?: (ctx: UpdateStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.transactionOrLockingStatement`.
	 * @param ctx the parse tree
	 */
	enterTransactionOrLockingStatement?: (ctx: TransactionOrLockingStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.transactionOrLockingStatement`.
	 * @param ctx the parse tree
	 */
	exitTransactionOrLockingStatement?: (ctx: TransactionOrLockingStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.transactionStatement`.
	 * @param ctx the parse tree
	 */
	enterTransactionStatement?: (ctx: TransactionStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.transactionStatement`.
	 * @param ctx the parse tree
	 */
	exitTransactionStatement?: (ctx: TransactionStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.beginWork`.
	 * @param ctx the parse tree
	 */
	enterBeginWork?: (ctx: BeginWorkContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.beginWork`.
	 * @param ctx the parse tree
	 */
	exitBeginWork?: (ctx: BeginWorkContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.transactionCharacteristic`.
	 * @param ctx the parse tree
	 */
	enterTransactionCharacteristic?: (ctx: TransactionCharacteristicContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.transactionCharacteristic`.
	 * @param ctx the parse tree
	 */
	exitTransactionCharacteristic?: (ctx: TransactionCharacteristicContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.savepointStatement`.
	 * @param ctx the parse tree
	 */
	enterSavepointStatement?: (ctx: SavepointStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.savepointStatement`.
	 * @param ctx the parse tree
	 */
	exitSavepointStatement?: (ctx: SavepointStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.lockStatement`.
	 * @param ctx the parse tree
	 */
	enterLockStatement?: (ctx: LockStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.lockStatement`.
	 * @param ctx the parse tree
	 */
	exitLockStatement?: (ctx: LockStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.lockItem`.
	 * @param ctx the parse tree
	 */
	enterLockItem?: (ctx: LockItemContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.lockItem`.
	 * @param ctx the parse tree
	 */
	exitLockItem?: (ctx: LockItemContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.lockOption`.
	 * @param ctx the parse tree
	 */
	enterLockOption?: (ctx: LockOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.lockOption`.
	 * @param ctx the parse tree
	 */
	exitLockOption?: (ctx: LockOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.xaStatement`.
	 * @param ctx the parse tree
	 */
	enterXaStatement?: (ctx: XaStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.xaStatement`.
	 * @param ctx the parse tree
	 */
	exitXaStatement?: (ctx: XaStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.xaConvert`.
	 * @param ctx the parse tree
	 */
	enterXaConvert?: (ctx: XaConvertContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.xaConvert`.
	 * @param ctx the parse tree
	 */
	exitXaConvert?: (ctx: XaConvertContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.xid`.
	 * @param ctx the parse tree
	 */
	enterXid?: (ctx: XidContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.xid`.
	 * @param ctx the parse tree
	 */
	exitXid?: (ctx: XidContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.replicationStatement`.
	 * @param ctx the parse tree
	 */
	enterReplicationStatement?: (ctx: ReplicationStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.replicationStatement`.
	 * @param ctx the parse tree
	 */
	exitReplicationStatement?: (ctx: ReplicationStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.resetOption`.
	 * @param ctx the parse tree
	 */
	enterResetOption?: (ctx: ResetOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.resetOption`.
	 * @param ctx the parse tree
	 */
	exitResetOption?: (ctx: ResetOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.masterResetOptions`.
	 * @param ctx the parse tree
	 */
	enterMasterResetOptions?: (ctx: MasterResetOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.masterResetOptions`.
	 * @param ctx the parse tree
	 */
	exitMasterResetOptions?: (ctx: MasterResetOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.replicationLoad`.
	 * @param ctx the parse tree
	 */
	enterReplicationLoad?: (ctx: ReplicationLoadContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.replicationLoad`.
	 * @param ctx the parse tree
	 */
	exitReplicationLoad?: (ctx: ReplicationLoadContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.changeMaster`.
	 * @param ctx the parse tree
	 */
	enterChangeMaster?: (ctx: ChangeMasterContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.changeMaster`.
	 * @param ctx the parse tree
	 */
	exitChangeMaster?: (ctx: ChangeMasterContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.changeMasterOptions`.
	 * @param ctx the parse tree
	 */
	enterChangeMasterOptions?: (ctx: ChangeMasterOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.changeMasterOptions`.
	 * @param ctx the parse tree
	 */
	exitChangeMasterOptions?: (ctx: ChangeMasterOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.masterOption`.
	 * @param ctx the parse tree
	 */
	enterMasterOption?: (ctx: MasterOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.masterOption`.
	 * @param ctx the parse tree
	 */
	exitMasterOption?: (ctx: MasterOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.privilegeCheckDef`.
	 * @param ctx the parse tree
	 */
	enterPrivilegeCheckDef?: (ctx: PrivilegeCheckDefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.privilegeCheckDef`.
	 * @param ctx the parse tree
	 */
	exitPrivilegeCheckDef?: (ctx: PrivilegeCheckDefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.masterTlsCiphersuitesDef`.
	 * @param ctx the parse tree
	 */
	enterMasterTlsCiphersuitesDef?: (ctx: MasterTlsCiphersuitesDefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.masterTlsCiphersuitesDef`.
	 * @param ctx the parse tree
	 */
	exitMasterTlsCiphersuitesDef?: (ctx: MasterTlsCiphersuitesDefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.masterFileDef`.
	 * @param ctx the parse tree
	 */
	enterMasterFileDef?: (ctx: MasterFileDefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.masterFileDef`.
	 * @param ctx the parse tree
	 */
	exitMasterFileDef?: (ctx: MasterFileDefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.serverIdList`.
	 * @param ctx the parse tree
	 */
	enterServerIdList?: (ctx: ServerIdListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.serverIdList`.
	 * @param ctx the parse tree
	 */
	exitServerIdList?: (ctx: ServerIdListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.changeReplication`.
	 * @param ctx the parse tree
	 */
	enterChangeReplication?: (ctx: ChangeReplicationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.changeReplication`.
	 * @param ctx the parse tree
	 */
	exitChangeReplication?: (ctx: ChangeReplicationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.filterDefinition`.
	 * @param ctx the parse tree
	 */
	enterFilterDefinition?: (ctx: FilterDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.filterDefinition`.
	 * @param ctx the parse tree
	 */
	exitFilterDefinition?: (ctx: FilterDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.filterDbList`.
	 * @param ctx the parse tree
	 */
	enterFilterDbList?: (ctx: FilterDbListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.filterDbList`.
	 * @param ctx the parse tree
	 */
	exitFilterDbList?: (ctx: FilterDbListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.filterTableList`.
	 * @param ctx the parse tree
	 */
	enterFilterTableList?: (ctx: FilterTableListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.filterTableList`.
	 * @param ctx the parse tree
	 */
	exitFilterTableList?: (ctx: FilterTableListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.filterStringList`.
	 * @param ctx the parse tree
	 */
	enterFilterStringList?: (ctx: FilterStringListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.filterStringList`.
	 * @param ctx the parse tree
	 */
	exitFilterStringList?: (ctx: FilterStringListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.filterWildDbTableString`.
	 * @param ctx the parse tree
	 */
	enterFilterWildDbTableString?: (ctx: FilterWildDbTableStringContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.filterWildDbTableString`.
	 * @param ctx the parse tree
	 */
	exitFilterWildDbTableString?: (ctx: FilterWildDbTableStringContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.filterDbPairList`.
	 * @param ctx the parse tree
	 */
	enterFilterDbPairList?: (ctx: FilterDbPairListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.filterDbPairList`.
	 * @param ctx the parse tree
	 */
	exitFilterDbPairList?: (ctx: FilterDbPairListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.slave`.
	 * @param ctx the parse tree
	 */
	enterSlave?: (ctx: SlaveContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.slave`.
	 * @param ctx the parse tree
	 */
	exitSlave?: (ctx: SlaveContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.slaveUntilOptions`.
	 * @param ctx the parse tree
	 */
	enterSlaveUntilOptions?: (ctx: SlaveUntilOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.slaveUntilOptions`.
	 * @param ctx the parse tree
	 */
	exitSlaveUntilOptions?: (ctx: SlaveUntilOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.slaveConnectionOptions`.
	 * @param ctx the parse tree
	 */
	enterSlaveConnectionOptions?: (ctx: SlaveConnectionOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.slaveConnectionOptions`.
	 * @param ctx the parse tree
	 */
	exitSlaveConnectionOptions?: (ctx: SlaveConnectionOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.slaveThreadOptions`.
	 * @param ctx the parse tree
	 */
	enterSlaveThreadOptions?: (ctx: SlaveThreadOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.slaveThreadOptions`.
	 * @param ctx the parse tree
	 */
	exitSlaveThreadOptions?: (ctx: SlaveThreadOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.slaveThreadOption`.
	 * @param ctx the parse tree
	 */
	enterSlaveThreadOption?: (ctx: SlaveThreadOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.slaveThreadOption`.
	 * @param ctx the parse tree
	 */
	exitSlaveThreadOption?: (ctx: SlaveThreadOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.groupReplication`.
	 * @param ctx the parse tree
	 */
	enterGroupReplication?: (ctx: GroupReplicationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.groupReplication`.
	 * @param ctx the parse tree
	 */
	exitGroupReplication?: (ctx: GroupReplicationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.preparedStatement`.
	 * @param ctx the parse tree
	 */
	enterPreparedStatement?: (ctx: PreparedStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.preparedStatement`.
	 * @param ctx the parse tree
	 */
	exitPreparedStatement?: (ctx: PreparedStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.executeStatement`.
	 * @param ctx the parse tree
	 */
	enterExecuteStatement?: (ctx: ExecuteStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.executeStatement`.
	 * @param ctx the parse tree
	 */
	exitExecuteStatement?: (ctx: ExecuteStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.executeVarList`.
	 * @param ctx the parse tree
	 */
	enterExecuteVarList?: (ctx: ExecuteVarListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.executeVarList`.
	 * @param ctx the parse tree
	 */
	exitExecuteVarList?: (ctx: ExecuteVarListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.cloneStatement`.
	 * @param ctx the parse tree
	 */
	enterCloneStatement?: (ctx: CloneStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.cloneStatement`.
	 * @param ctx the parse tree
	 */
	exitCloneStatement?: (ctx: CloneStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dataDirSSL`.
	 * @param ctx the parse tree
	 */
	enterDataDirSSL?: (ctx: DataDirSSLContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dataDirSSL`.
	 * @param ctx the parse tree
	 */
	exitDataDirSSL?: (ctx: DataDirSSLContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.ssl`.
	 * @param ctx the parse tree
	 */
	enterSsl?: (ctx: SslContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.ssl`.
	 * @param ctx the parse tree
	 */
	exitSsl?: (ctx: SslContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.accountManagementStatement`.
	 * @param ctx the parse tree
	 */
	enterAccountManagementStatement?: (ctx: AccountManagementStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.accountManagementStatement`.
	 * @param ctx the parse tree
	 */
	exitAccountManagementStatement?: (ctx: AccountManagementStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterUser`.
	 * @param ctx the parse tree
	 */
	enterAlterUser?: (ctx: AlterUserContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterUser`.
	 * @param ctx the parse tree
	 */
	exitAlterUser?: (ctx: AlterUserContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterUserTail`.
	 * @param ctx the parse tree
	 */
	enterAlterUserTail?: (ctx: AlterUserTailContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterUserTail`.
	 * @param ctx the parse tree
	 */
	exitAlterUserTail?: (ctx: AlterUserTailContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.userFunction`.
	 * @param ctx the parse tree
	 */
	enterUserFunction?: (ctx: UserFunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.userFunction`.
	 * @param ctx the parse tree
	 */
	exitUserFunction?: (ctx: UserFunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createUser`.
	 * @param ctx the parse tree
	 */
	enterCreateUser?: (ctx: CreateUserContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createUser`.
	 * @param ctx the parse tree
	 */
	exitCreateUser?: (ctx: CreateUserContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createUserTail`.
	 * @param ctx the parse tree
	 */
	enterCreateUserTail?: (ctx: CreateUserTailContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createUserTail`.
	 * @param ctx the parse tree
	 */
	exitCreateUserTail?: (ctx: CreateUserTailContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.defaultRoleClause`.
	 * @param ctx the parse tree
	 */
	enterDefaultRoleClause?: (ctx: DefaultRoleClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.defaultRoleClause`.
	 * @param ctx the parse tree
	 */
	exitDefaultRoleClause?: (ctx: DefaultRoleClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.requireClause`.
	 * @param ctx the parse tree
	 */
	enterRequireClause?: (ctx: RequireClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.requireClause`.
	 * @param ctx the parse tree
	 */
	exitRequireClause?: (ctx: RequireClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.connectOptions`.
	 * @param ctx the parse tree
	 */
	enterConnectOptions?: (ctx: ConnectOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.connectOptions`.
	 * @param ctx the parse tree
	 */
	exitConnectOptions?: (ctx: ConnectOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.accountLockPasswordExpireOptions`.
	 * @param ctx the parse tree
	 */
	enterAccountLockPasswordExpireOptions?: (ctx: AccountLockPasswordExpireOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.accountLockPasswordExpireOptions`.
	 * @param ctx the parse tree
	 */
	exitAccountLockPasswordExpireOptions?: (ctx: AccountLockPasswordExpireOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropUser`.
	 * @param ctx the parse tree
	 */
	enterDropUser?: (ctx: DropUserContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropUser`.
	 * @param ctx the parse tree
	 */
	exitDropUser?: (ctx: DropUserContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.grant`.
	 * @param ctx the parse tree
	 */
	enterGrant?: (ctx: GrantContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.grant`.
	 * @param ctx the parse tree
	 */
	exitGrant?: (ctx: GrantContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.grantTargetList`.
	 * @param ctx the parse tree
	 */
	enterGrantTargetList?: (ctx: GrantTargetListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.grantTargetList`.
	 * @param ctx the parse tree
	 */
	exitGrantTargetList?: (ctx: GrantTargetListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.grantOptions`.
	 * @param ctx the parse tree
	 */
	enterGrantOptions?: (ctx: GrantOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.grantOptions`.
	 * @param ctx the parse tree
	 */
	exitGrantOptions?: (ctx: GrantOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.exceptRoleList`.
	 * @param ctx the parse tree
	 */
	enterExceptRoleList?: (ctx: ExceptRoleListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.exceptRoleList`.
	 * @param ctx the parse tree
	 */
	exitExceptRoleList?: (ctx: ExceptRoleListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.withRoles`.
	 * @param ctx the parse tree
	 */
	enterWithRoles?: (ctx: WithRolesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.withRoles`.
	 * @param ctx the parse tree
	 */
	exitWithRoles?: (ctx: WithRolesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.grantAs`.
	 * @param ctx the parse tree
	 */
	enterGrantAs?: (ctx: GrantAsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.grantAs`.
	 * @param ctx the parse tree
	 */
	exitGrantAs?: (ctx: GrantAsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.versionedRequireClause`.
	 * @param ctx the parse tree
	 */
	enterVersionedRequireClause?: (ctx: VersionedRequireClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.versionedRequireClause`.
	 * @param ctx the parse tree
	 */
	exitVersionedRequireClause?: (ctx: VersionedRequireClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.renameUser`.
	 * @param ctx the parse tree
	 */
	enterRenameUser?: (ctx: RenameUserContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.renameUser`.
	 * @param ctx the parse tree
	 */
	exitRenameUser?: (ctx: RenameUserContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.revoke`.
	 * @param ctx the parse tree
	 */
	enterRevoke?: (ctx: RevokeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.revoke`.
	 * @param ctx the parse tree
	 */
	exitRevoke?: (ctx: RevokeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.onTypeTo`.
	 * @param ctx the parse tree
	 */
	enterOnTypeTo?: (ctx: OnTypeToContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.onTypeTo`.
	 * @param ctx the parse tree
	 */
	exitOnTypeTo?: (ctx: OnTypeToContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.aclType`.
	 * @param ctx the parse tree
	 */
	enterAclType?: (ctx: AclTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.aclType`.
	 * @param ctx the parse tree
	 */
	exitAclType?: (ctx: AclTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.roleOrPrivilegesList`.
	 * @param ctx the parse tree
	 */
	enterRoleOrPrivilegesList?: (ctx: RoleOrPrivilegesListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.roleOrPrivilegesList`.
	 * @param ctx the parse tree
	 */
	exitRoleOrPrivilegesList?: (ctx: RoleOrPrivilegesListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.roleOrPrivilege`.
	 * @param ctx the parse tree
	 */
	enterRoleOrPrivilege?: (ctx: RoleOrPrivilegeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.roleOrPrivilege`.
	 * @param ctx the parse tree
	 */
	exitRoleOrPrivilege?: (ctx: RoleOrPrivilegeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.grantIdentifier`.
	 * @param ctx the parse tree
	 */
	enterGrantIdentifier?: (ctx: GrantIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.grantIdentifier`.
	 * @param ctx the parse tree
	 */
	exitGrantIdentifier?: (ctx: GrantIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.requireList`.
	 * @param ctx the parse tree
	 */
	enterRequireList?: (ctx: RequireListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.requireList`.
	 * @param ctx the parse tree
	 */
	exitRequireList?: (ctx: RequireListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.requireListElement`.
	 * @param ctx the parse tree
	 */
	enterRequireListElement?: (ctx: RequireListElementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.requireListElement`.
	 * @param ctx the parse tree
	 */
	exitRequireListElement?: (ctx: RequireListElementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.grantOption`.
	 * @param ctx the parse tree
	 */
	enterGrantOption?: (ctx: GrantOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.grantOption`.
	 * @param ctx the parse tree
	 */
	exitGrantOption?: (ctx: GrantOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.setRole`.
	 * @param ctx the parse tree
	 */
	enterSetRole?: (ctx: SetRoleContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.setRole`.
	 * @param ctx the parse tree
	 */
	exitSetRole?: (ctx: SetRoleContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.roleList`.
	 * @param ctx the parse tree
	 */
	enterRoleList?: (ctx: RoleListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.roleList`.
	 * @param ctx the parse tree
	 */
	exitRoleList?: (ctx: RoleListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.role`.
	 * @param ctx the parse tree
	 */
	enterRole?: (ctx: RoleContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.role`.
	 * @param ctx the parse tree
	 */
	exitRole?: (ctx: RoleContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableAdministrationStatement`.
	 * @param ctx the parse tree
	 */
	enterTableAdministrationStatement?: (ctx: TableAdministrationStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableAdministrationStatement`.
	 * @param ctx the parse tree
	 */
	exitTableAdministrationStatement?: (ctx: TableAdministrationStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.histogram`.
	 * @param ctx the parse tree
	 */
	enterHistogram?: (ctx: HistogramContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.histogram`.
	 * @param ctx the parse tree
	 */
	exitHistogram?: (ctx: HistogramContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.checkOption`.
	 * @param ctx the parse tree
	 */
	enterCheckOption?: (ctx: CheckOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.checkOption`.
	 * @param ctx the parse tree
	 */
	exitCheckOption?: (ctx: CheckOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.repairType`.
	 * @param ctx the parse tree
	 */
	enterRepairType?: (ctx: RepairTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.repairType`.
	 * @param ctx the parse tree
	 */
	exitRepairType?: (ctx: RepairTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.installUninstallStatment`.
	 * @param ctx the parse tree
	 */
	enterInstallUninstallStatment?: (ctx: InstallUninstallStatmentContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.installUninstallStatment`.
	 * @param ctx the parse tree
	 */
	exitInstallUninstallStatment?: (ctx: InstallUninstallStatmentContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.setStatement`.
	 * @param ctx the parse tree
	 */
	enterSetStatement?: (ctx: SetStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.setStatement`.
	 * @param ctx the parse tree
	 */
	exitSetStatement?: (ctx: SetStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.startOptionValueList`.
	 * @param ctx the parse tree
	 */
	enterStartOptionValueList?: (ctx: StartOptionValueListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.startOptionValueList`.
	 * @param ctx the parse tree
	 */
	exitStartOptionValueList?: (ctx: StartOptionValueListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.transactionCharacteristics`.
	 * @param ctx the parse tree
	 */
	enterTransactionCharacteristics?: (ctx: TransactionCharacteristicsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.transactionCharacteristics`.
	 * @param ctx the parse tree
	 */
	exitTransactionCharacteristics?: (ctx: TransactionCharacteristicsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.transactionAccessMode`.
	 * @param ctx the parse tree
	 */
	enterTransactionAccessMode?: (ctx: TransactionAccessModeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.transactionAccessMode`.
	 * @param ctx the parse tree
	 */
	exitTransactionAccessMode?: (ctx: TransactionAccessModeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.isolationLevel`.
	 * @param ctx the parse tree
	 */
	enterIsolationLevel?: (ctx: IsolationLevelContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.isolationLevel`.
	 * @param ctx the parse tree
	 */
	exitIsolationLevel?: (ctx: IsolationLevelContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.optionValueListContinued`.
	 * @param ctx the parse tree
	 */
	enterOptionValueListContinued?: (ctx: OptionValueListContinuedContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.optionValueListContinued`.
	 * @param ctx the parse tree
	 */
	exitOptionValueListContinued?: (ctx: OptionValueListContinuedContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.optionValueNoOptionType`.
	 * @param ctx the parse tree
	 */
	enterOptionValueNoOptionType?: (ctx: OptionValueNoOptionTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.optionValueNoOptionType`.
	 * @param ctx the parse tree
	 */
	exitOptionValueNoOptionType?: (ctx: OptionValueNoOptionTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.optionValue`.
	 * @param ctx the parse tree
	 */
	enterOptionValue?: (ctx: OptionValueContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.optionValue`.
	 * @param ctx the parse tree
	 */
	exitOptionValue?: (ctx: OptionValueContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.setSystemVariable`.
	 * @param ctx the parse tree
	 */
	enterSetSystemVariable?: (ctx: SetSystemVariableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.setSystemVariable`.
	 * @param ctx the parse tree
	 */
	exitSetSystemVariable?: (ctx: SetSystemVariableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.startOptionValueListFollowingOptionType`.
	 * @param ctx the parse tree
	 */
	enterStartOptionValueListFollowingOptionType?: (ctx: StartOptionValueListFollowingOptionTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.startOptionValueListFollowingOptionType`.
	 * @param ctx the parse tree
	 */
	exitStartOptionValueListFollowingOptionType?: (ctx: StartOptionValueListFollowingOptionTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.optionValueFollowingOptionType`.
	 * @param ctx the parse tree
	 */
	enterOptionValueFollowingOptionType?: (ctx: OptionValueFollowingOptionTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.optionValueFollowingOptionType`.
	 * @param ctx the parse tree
	 */
	exitOptionValueFollowingOptionType?: (ctx: OptionValueFollowingOptionTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.setExprOrDefault`.
	 * @param ctx the parse tree
	 */
	enterSetExprOrDefault?: (ctx: SetExprOrDefaultContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.setExprOrDefault`.
	 * @param ctx the parse tree
	 */
	exitSetExprOrDefault?: (ctx: SetExprOrDefaultContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.showStatement`.
	 * @param ctx the parse tree
	 */
	enterShowStatement?: (ctx: ShowStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.showStatement`.
	 * @param ctx the parse tree
	 */
	exitShowStatement?: (ctx: ShowStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.showCommandType`.
	 * @param ctx the parse tree
	 */
	enterShowCommandType?: (ctx: ShowCommandTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.showCommandType`.
	 * @param ctx the parse tree
	 */
	exitShowCommandType?: (ctx: ShowCommandTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.nonBlocking`.
	 * @param ctx the parse tree
	 */
	enterNonBlocking?: (ctx: NonBlockingContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.nonBlocking`.
	 * @param ctx the parse tree
	 */
	exitNonBlocking?: (ctx: NonBlockingContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fromOrIn`.
	 * @param ctx the parse tree
	 */
	enterFromOrIn?: (ctx: FromOrInContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fromOrIn`.
	 * @param ctx the parse tree
	 */
	exitFromOrIn?: (ctx: FromOrInContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.inDb`.
	 * @param ctx the parse tree
	 */
	enterInDb?: (ctx: InDbContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.inDb`.
	 * @param ctx the parse tree
	 */
	exitInDb?: (ctx: InDbContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.profileType`.
	 * @param ctx the parse tree
	 */
	enterProfileType?: (ctx: ProfileTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.profileType`.
	 * @param ctx the parse tree
	 */
	exitProfileType?: (ctx: ProfileTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.otherAdministrativeStatement`.
	 * @param ctx the parse tree
	 */
	enterOtherAdministrativeStatement?: (ctx: OtherAdministrativeStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.otherAdministrativeStatement`.
	 * @param ctx the parse tree
	 */
	exitOtherAdministrativeStatement?: (ctx: OtherAdministrativeStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyCacheListOrParts`.
	 * @param ctx the parse tree
	 */
	enterKeyCacheListOrParts?: (ctx: KeyCacheListOrPartsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyCacheListOrParts`.
	 * @param ctx the parse tree
	 */
	exitKeyCacheListOrParts?: (ctx: KeyCacheListOrPartsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyCacheList`.
	 * @param ctx the parse tree
	 */
	enterKeyCacheList?: (ctx: KeyCacheListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyCacheList`.
	 * @param ctx the parse tree
	 */
	exitKeyCacheList?: (ctx: KeyCacheListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.assignToKeycache`.
	 * @param ctx the parse tree
	 */
	enterAssignToKeycache?: (ctx: AssignToKeycacheContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.assignToKeycache`.
	 * @param ctx the parse tree
	 */
	exitAssignToKeycache?: (ctx: AssignToKeycacheContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.assignToKeycachePartition`.
	 * @param ctx the parse tree
	 */
	enterAssignToKeycachePartition?: (ctx: AssignToKeycachePartitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.assignToKeycachePartition`.
	 * @param ctx the parse tree
	 */
	exitAssignToKeycachePartition?: (ctx: AssignToKeycachePartitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.cacheKeyList`.
	 * @param ctx the parse tree
	 */
	enterCacheKeyList?: (ctx: CacheKeyListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.cacheKeyList`.
	 * @param ctx the parse tree
	 */
	exitCacheKeyList?: (ctx: CacheKeyListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyUsageElement`.
	 * @param ctx the parse tree
	 */
	enterKeyUsageElement?: (ctx: KeyUsageElementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyUsageElement`.
	 * @param ctx the parse tree
	 */
	exitKeyUsageElement?: (ctx: KeyUsageElementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyUsageList`.
	 * @param ctx the parse tree
	 */
	enterKeyUsageList?: (ctx: KeyUsageListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyUsageList`.
	 * @param ctx the parse tree
	 */
	exitKeyUsageList?: (ctx: KeyUsageListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.flushOption`.
	 * @param ctx the parse tree
	 */
	enterFlushOption?: (ctx: FlushOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.flushOption`.
	 * @param ctx the parse tree
	 */
	exitFlushOption?: (ctx: FlushOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.logType`.
	 * @param ctx the parse tree
	 */
	enterLogType?: (ctx: LogTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.logType`.
	 * @param ctx the parse tree
	 */
	exitLogType?: (ctx: LogTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.flushTables`.
	 * @param ctx the parse tree
	 */
	enterFlushTables?: (ctx: FlushTablesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.flushTables`.
	 * @param ctx the parse tree
	 */
	exitFlushTables?: (ctx: FlushTablesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.flushTablesOptions`.
	 * @param ctx the parse tree
	 */
	enterFlushTablesOptions?: (ctx: FlushTablesOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.flushTablesOptions`.
	 * @param ctx the parse tree
	 */
	exitFlushTablesOptions?: (ctx: FlushTablesOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.preloadTail`.
	 * @param ctx the parse tree
	 */
	enterPreloadTail?: (ctx: PreloadTailContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.preloadTail`.
	 * @param ctx the parse tree
	 */
	exitPreloadTail?: (ctx: PreloadTailContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.preloadList`.
	 * @param ctx the parse tree
	 */
	enterPreloadList?: (ctx: PreloadListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.preloadList`.
	 * @param ctx the parse tree
	 */
	exitPreloadList?: (ctx: PreloadListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.preloadKeys`.
	 * @param ctx the parse tree
	 */
	enterPreloadKeys?: (ctx: PreloadKeysContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.preloadKeys`.
	 * @param ctx the parse tree
	 */
	exitPreloadKeys?: (ctx: PreloadKeysContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.adminPartition`.
	 * @param ctx the parse tree
	 */
	enterAdminPartition?: (ctx: AdminPartitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.adminPartition`.
	 * @param ctx the parse tree
	 */
	exitAdminPartition?: (ctx: AdminPartitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.resourceGroupManagement`.
	 * @param ctx the parse tree
	 */
	enterResourceGroupManagement?: (ctx: ResourceGroupManagementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.resourceGroupManagement`.
	 * @param ctx the parse tree
	 */
	exitResourceGroupManagement?: (ctx: ResourceGroupManagementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createResourceGroup`.
	 * @param ctx the parse tree
	 */
	enterCreateResourceGroup?: (ctx: CreateResourceGroupContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createResourceGroup`.
	 * @param ctx the parse tree
	 */
	exitCreateResourceGroup?: (ctx: CreateResourceGroupContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.resourceGroupVcpuList`.
	 * @param ctx the parse tree
	 */
	enterResourceGroupVcpuList?: (ctx: ResourceGroupVcpuListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.resourceGroupVcpuList`.
	 * @param ctx the parse tree
	 */
	exitResourceGroupVcpuList?: (ctx: ResourceGroupVcpuListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.vcpuNumOrRange`.
	 * @param ctx the parse tree
	 */
	enterVcpuNumOrRange?: (ctx: VcpuNumOrRangeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.vcpuNumOrRange`.
	 * @param ctx the parse tree
	 */
	exitVcpuNumOrRange?: (ctx: VcpuNumOrRangeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.resourceGroupPriority`.
	 * @param ctx the parse tree
	 */
	enterResourceGroupPriority?: (ctx: ResourceGroupPriorityContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.resourceGroupPriority`.
	 * @param ctx the parse tree
	 */
	exitResourceGroupPriority?: (ctx: ResourceGroupPriorityContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.resourceGroupEnableDisable`.
	 * @param ctx the parse tree
	 */
	enterResourceGroupEnableDisable?: (ctx: ResourceGroupEnableDisableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.resourceGroupEnableDisable`.
	 * @param ctx the parse tree
	 */
	exitResourceGroupEnableDisable?: (ctx: ResourceGroupEnableDisableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterResourceGroup`.
	 * @param ctx the parse tree
	 */
	enterAlterResourceGroup?: (ctx: AlterResourceGroupContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterResourceGroup`.
	 * @param ctx the parse tree
	 */
	exitAlterResourceGroup?: (ctx: AlterResourceGroupContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.setResourceGroup`.
	 * @param ctx the parse tree
	 */
	enterSetResourceGroup?: (ctx: SetResourceGroupContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.setResourceGroup`.
	 * @param ctx the parse tree
	 */
	exitSetResourceGroup?: (ctx: SetResourceGroupContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.threadIdList`.
	 * @param ctx the parse tree
	 */
	enterThreadIdList?: (ctx: ThreadIdListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.threadIdList`.
	 * @param ctx the parse tree
	 */
	exitThreadIdList?: (ctx: ThreadIdListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dropResourceGroup`.
	 * @param ctx the parse tree
	 */
	enterDropResourceGroup?: (ctx: DropResourceGroupContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dropResourceGroup`.
	 * @param ctx the parse tree
	 */
	exitDropResourceGroup?: (ctx: DropResourceGroupContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.utilityStatement`.
	 * @param ctx the parse tree
	 */
	enterUtilityStatement?: (ctx: UtilityStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.utilityStatement`.
	 * @param ctx the parse tree
	 */
	exitUtilityStatement?: (ctx: UtilityStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.describeCommand`.
	 * @param ctx the parse tree
	 */
	enterDescribeCommand?: (ctx: DescribeCommandContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.describeCommand`.
	 * @param ctx the parse tree
	 */
	exitDescribeCommand?: (ctx: DescribeCommandContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.explainCommand`.
	 * @param ctx the parse tree
	 */
	enterExplainCommand?: (ctx: ExplainCommandContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.explainCommand`.
	 * @param ctx the parse tree
	 */
	exitExplainCommand?: (ctx: ExplainCommandContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.explainableStatement`.
	 * @param ctx the parse tree
	 */
	enterExplainableStatement?: (ctx: ExplainableStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.explainableStatement`.
	 * @param ctx the parse tree
	 */
	exitExplainableStatement?: (ctx: ExplainableStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.helpCommand`.
	 * @param ctx the parse tree
	 */
	enterHelpCommand?: (ctx: HelpCommandContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.helpCommand`.
	 * @param ctx the parse tree
	 */
	exitHelpCommand?: (ctx: HelpCommandContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.useCommand`.
	 * @param ctx the parse tree
	 */
	enterUseCommand?: (ctx: UseCommandContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.useCommand`.
	 * @param ctx the parse tree
	 */
	exitUseCommand?: (ctx: UseCommandContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.restartServer`.
	 * @param ctx the parse tree
	 */
	enterRestartServer?: (ctx: RestartServerContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.restartServer`.
	 * @param ctx the parse tree
	 */
	exitRestartServer?: (ctx: RestartServerContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	enterExpr?: (ctx: ExprContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.expr`.
	 * @param ctx the parse tree
	 */
	exitExpr?: (ctx: ExprContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	enterBoolPri?: (ctx: BoolPriContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.boolPri`.
	 * @param ctx the parse tree
	 */
	exitBoolPri?: (ctx: BoolPriContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.compOp`.
	 * @param ctx the parse tree
	 */
	enterCompOp?: (ctx: CompOpContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.compOp`.
	 * @param ctx the parse tree
	 */
	exitCompOp?: (ctx: CompOpContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.predicate`.
	 * @param ctx the parse tree
	 */
	enterPredicate?: (ctx: PredicateContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.predicate`.
	 * @param ctx the parse tree
	 */
	exitPredicate?: (ctx: PredicateContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	enterPredicateOperations?: (ctx: PredicateOperationsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.predicateOperations`.
	 * @param ctx the parse tree
	 */
	exitPredicateOperations?: (ctx: PredicateOperationsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.bitExpr`.
	 * @param ctx the parse tree
	 */
	enterBitExpr?: (ctx: BitExprContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.bitExpr`.
	 * @param ctx the parse tree
	 */
	exitBitExpr?: (ctx: BitExprContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	enterSimpleExpr?: (ctx: SimpleExprContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.simpleExpr`.
	 * @param ctx the parse tree
	 */
	exitSimpleExpr?: (ctx: SimpleExprContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.arrayCast`.
	 * @param ctx the parse tree
	 */
	enterArrayCast?: (ctx: ArrayCastContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.arrayCast`.
	 * @param ctx the parse tree
	 */
	exitArrayCast?: (ctx: ArrayCastContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.jsonOperator`.
	 * @param ctx the parse tree
	 */
	enterJsonOperator?: (ctx: JsonOperatorContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.jsonOperator`.
	 * @param ctx the parse tree
	 */
	exitJsonOperator?: (ctx: JsonOperatorContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.sumExpr`.
	 * @param ctx the parse tree
	 */
	enterSumExpr?: (ctx: SumExprContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.sumExpr`.
	 * @param ctx the parse tree
	 */
	exitSumExpr?: (ctx: SumExprContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.groupingOperation`.
	 * @param ctx the parse tree
	 */
	enterGroupingOperation?: (ctx: GroupingOperationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.groupingOperation`.
	 * @param ctx the parse tree
	 */
	exitGroupingOperation?: (ctx: GroupingOperationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowFunctionCall`.
	 * @param ctx the parse tree
	 */
	enterWindowFunctionCall?: (ctx: WindowFunctionCallContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowFunctionCall`.
	 * @param ctx the parse tree
	 */
	exitWindowFunctionCall?: (ctx: WindowFunctionCallContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowingClause`.
	 * @param ctx the parse tree
	 */
	enterWindowingClause?: (ctx: WindowingClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowingClause`.
	 * @param ctx the parse tree
	 */
	exitWindowingClause?: (ctx: WindowingClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.leadLagInfo`.
	 * @param ctx the parse tree
	 */
	enterLeadLagInfo?: (ctx: LeadLagInfoContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.leadLagInfo`.
	 * @param ctx the parse tree
	 */
	exitLeadLagInfo?: (ctx: LeadLagInfoContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.nullTreatment`.
	 * @param ctx the parse tree
	 */
	enterNullTreatment?: (ctx: NullTreatmentContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.nullTreatment`.
	 * @param ctx the parse tree
	 */
	exitNullTreatment?: (ctx: NullTreatmentContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.jsonFunction`.
	 * @param ctx the parse tree
	 */
	enterJsonFunction?: (ctx: JsonFunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.jsonFunction`.
	 * @param ctx the parse tree
	 */
	exitJsonFunction?: (ctx: JsonFunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.inSumExpr`.
	 * @param ctx the parse tree
	 */
	enterInSumExpr?: (ctx: InSumExprContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.inSumExpr`.
	 * @param ctx the parse tree
	 */
	exitInSumExpr?: (ctx: InSumExprContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identListArg`.
	 * @param ctx the parse tree
	 */
	enterIdentListArg?: (ctx: IdentListArgContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identListArg`.
	 * @param ctx the parse tree
	 */
	exitIdentListArg?: (ctx: IdentListArgContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identList`.
	 * @param ctx the parse tree
	 */
	enterIdentList?: (ctx: IdentListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identList`.
	 * @param ctx the parse tree
	 */
	exitIdentList?: (ctx: IdentListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fulltextOptions`.
	 * @param ctx the parse tree
	 */
	enterFulltextOptions?: (ctx: FulltextOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fulltextOptions`.
	 * @param ctx the parse tree
	 */
	exitFulltextOptions?: (ctx: FulltextOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.runtimeFunctionCall`.
	 * @param ctx the parse tree
	 */
	enterRuntimeFunctionCall?: (ctx: RuntimeFunctionCallContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.runtimeFunctionCall`.
	 * @param ctx the parse tree
	 */
	exitRuntimeFunctionCall?: (ctx: RuntimeFunctionCallContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.geometryFunction`.
	 * @param ctx the parse tree
	 */
	enterGeometryFunction?: (ctx: GeometryFunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.geometryFunction`.
	 * @param ctx the parse tree
	 */
	exitGeometryFunction?: (ctx: GeometryFunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.timeFunctionParameters`.
	 * @param ctx the parse tree
	 */
	enterTimeFunctionParameters?: (ctx: TimeFunctionParametersContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.timeFunctionParameters`.
	 * @param ctx the parse tree
	 */
	exitTimeFunctionParameters?: (ctx: TimeFunctionParametersContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fractionalPrecision`.
	 * @param ctx the parse tree
	 */
	enterFractionalPrecision?: (ctx: FractionalPrecisionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fractionalPrecision`.
	 * @param ctx the parse tree
	 */
	exitFractionalPrecision?: (ctx: FractionalPrecisionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.weightStringLevels`.
	 * @param ctx the parse tree
	 */
	enterWeightStringLevels?: (ctx: WeightStringLevelsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.weightStringLevels`.
	 * @param ctx the parse tree
	 */
	exitWeightStringLevels?: (ctx: WeightStringLevelsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.weightStringLevelListItem`.
	 * @param ctx the parse tree
	 */
	enterWeightStringLevelListItem?: (ctx: WeightStringLevelListItemContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.weightStringLevelListItem`.
	 * @param ctx the parse tree
	 */
	exitWeightStringLevelListItem?: (ctx: WeightStringLevelListItemContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dateTimeTtype`.
	 * @param ctx the parse tree
	 */
	enterDateTimeTtype?: (ctx: DateTimeTtypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dateTimeTtype`.
	 * @param ctx the parse tree
	 */
	exitDateTimeTtype?: (ctx: DateTimeTtypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.trimFunction`.
	 * @param ctx the parse tree
	 */
	enterTrimFunction?: (ctx: TrimFunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.trimFunction`.
	 * @param ctx the parse tree
	 */
	exitTrimFunction?: (ctx: TrimFunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.substringFunction`.
	 * @param ctx the parse tree
	 */
	enterSubstringFunction?: (ctx: SubstringFunctionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.substringFunction`.
	 * @param ctx the parse tree
	 */
	exitSubstringFunction?: (ctx: SubstringFunctionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.functionCall`.
	 * @param ctx the parse tree
	 */
	enterFunctionCall?: (ctx: FunctionCallContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.functionCall`.
	 * @param ctx the parse tree
	 */
	exitFunctionCall?: (ctx: FunctionCallContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.udfExprList`.
	 * @param ctx the parse tree
	 */
	enterUdfExprList?: (ctx: UdfExprListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.udfExprList`.
	 * @param ctx the parse tree
	 */
	exitUdfExprList?: (ctx: UdfExprListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.udfExpr`.
	 * @param ctx the parse tree
	 */
	enterUdfExpr?: (ctx: UdfExprContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.udfExpr`.
	 * @param ctx the parse tree
	 */
	exitUdfExpr?: (ctx: UdfExprContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.variable`.
	 * @param ctx the parse tree
	 */
	enterVariable?: (ctx: VariableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.variable`.
	 * @param ctx the parse tree
	 */
	exitVariable?: (ctx: VariableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.userVariable`.
	 * @param ctx the parse tree
	 */
	enterUserVariable?: (ctx: UserVariableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.userVariable`.
	 * @param ctx the parse tree
	 */
	exitUserVariable?: (ctx: UserVariableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.systemVariable`.
	 * @param ctx the parse tree
	 */
	enterSystemVariable?: (ctx: SystemVariableContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.systemVariable`.
	 * @param ctx the parse tree
	 */
	exitSystemVariable?: (ctx: SystemVariableContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.internalVariableName`.
	 * @param ctx the parse tree
	 */
	enterInternalVariableName?: (ctx: InternalVariableNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.internalVariableName`.
	 * @param ctx the parse tree
	 */
	exitInternalVariableName?: (ctx: InternalVariableNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.whenExpression`.
	 * @param ctx the parse tree
	 */
	enterWhenExpression?: (ctx: WhenExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.whenExpression`.
	 * @param ctx the parse tree
	 */
	exitWhenExpression?: (ctx: WhenExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.thenExpression`.
	 * @param ctx the parse tree
	 */
	enterThenExpression?: (ctx: ThenExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.thenExpression`.
	 * @param ctx the parse tree
	 */
	exitThenExpression?: (ctx: ThenExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.elseExpression`.
	 * @param ctx the parse tree
	 */
	enterElseExpression?: (ctx: ElseExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.elseExpression`.
	 * @param ctx the parse tree
	 */
	exitElseExpression?: (ctx: ElseExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.castType`.
	 * @param ctx the parse tree
	 */
	enterCastType?: (ctx: CastTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.castType`.
	 * @param ctx the parse tree
	 */
	exitCastType?: (ctx: CastTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.exprList`.
	 * @param ctx the parse tree
	 */
	enterExprList?: (ctx: ExprListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.exprList`.
	 * @param ctx the parse tree
	 */
	exitExprList?: (ctx: ExprListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.charset`.
	 * @param ctx the parse tree
	 */
	enterCharset?: (ctx: CharsetContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.charset`.
	 * @param ctx the parse tree
	 */
	exitCharset?: (ctx: CharsetContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.notRule`.
	 * @param ctx the parse tree
	 */
	enterNotRule?: (ctx: NotRuleContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.notRule`.
	 * @param ctx the parse tree
	 */
	exitNotRule?: (ctx: NotRuleContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.not2Rule`.
	 * @param ctx the parse tree
	 */
	enterNot2Rule?: (ctx: Not2RuleContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.not2Rule`.
	 * @param ctx the parse tree
	 */
	exitNot2Rule?: (ctx: Not2RuleContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.interval`.
	 * @param ctx the parse tree
	 */
	enterInterval?: (ctx: IntervalContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.interval`.
	 * @param ctx the parse tree
	 */
	exitInterval?: (ctx: IntervalContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.intervalTimeStamp`.
	 * @param ctx the parse tree
	 */
	enterIntervalTimeStamp?: (ctx: IntervalTimeStampContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.intervalTimeStamp`.
	 * @param ctx the parse tree
	 */
	exitIntervalTimeStamp?: (ctx: IntervalTimeStampContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.exprListWithParentheses`.
	 * @param ctx the parse tree
	 */
	enterExprListWithParentheses?: (ctx: ExprListWithParenthesesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.exprListWithParentheses`.
	 * @param ctx the parse tree
	 */
	exitExprListWithParentheses?: (ctx: ExprListWithParenthesesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.exprWithParentheses`.
	 * @param ctx the parse tree
	 */
	enterExprWithParentheses?: (ctx: ExprWithParenthesesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.exprWithParentheses`.
	 * @param ctx the parse tree
	 */
	exitExprWithParentheses?: (ctx: ExprWithParenthesesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.simpleExprWithParentheses`.
	 * @param ctx the parse tree
	 */
	enterSimpleExprWithParentheses?: (ctx: SimpleExprWithParenthesesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.simpleExprWithParentheses`.
	 * @param ctx the parse tree
	 */
	exitSimpleExprWithParentheses?: (ctx: SimpleExprWithParenthesesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.orderList`.
	 * @param ctx the parse tree
	 */
	enterOrderList?: (ctx: OrderListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.orderList`.
	 * @param ctx the parse tree
	 */
	exitOrderList?: (ctx: OrderListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.orderExpression`.
	 * @param ctx the parse tree
	 */
	enterOrderExpression?: (ctx: OrderExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.orderExpression`.
	 * @param ctx the parse tree
	 */
	exitOrderExpression?: (ctx: OrderExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.groupList`.
	 * @param ctx the parse tree
	 */
	enterGroupList?: (ctx: GroupListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.groupList`.
	 * @param ctx the parse tree
	 */
	exitGroupList?: (ctx: GroupListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.groupingExpression`.
	 * @param ctx the parse tree
	 */
	enterGroupingExpression?: (ctx: GroupingExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.groupingExpression`.
	 * @param ctx the parse tree
	 */
	exitGroupingExpression?: (ctx: GroupingExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.channel`.
	 * @param ctx the parse tree
	 */
	enterChannel?: (ctx: ChannelContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.channel`.
	 * @param ctx the parse tree
	 */
	exitChannel?: (ctx: ChannelContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.compoundStatement`.
	 * @param ctx the parse tree
	 */
	enterCompoundStatement?: (ctx: CompoundStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.compoundStatement`.
	 * @param ctx the parse tree
	 */
	exitCompoundStatement?: (ctx: CompoundStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.returnStatement`.
	 * @param ctx the parse tree
	 */
	enterReturnStatement?: (ctx: ReturnStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.returnStatement`.
	 * @param ctx the parse tree
	 */
	exitReturnStatement?: (ctx: ReturnStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.ifStatement`.
	 * @param ctx the parse tree
	 */
	enterIfStatement?: (ctx: IfStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.ifStatement`.
	 * @param ctx the parse tree
	 */
	exitIfStatement?: (ctx: IfStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.ifBody`.
	 * @param ctx the parse tree
	 */
	enterIfBody?: (ctx: IfBodyContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.ifBody`.
	 * @param ctx the parse tree
	 */
	exitIfBody?: (ctx: IfBodyContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.thenStatement`.
	 * @param ctx the parse tree
	 */
	enterThenStatement?: (ctx: ThenStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.thenStatement`.
	 * @param ctx the parse tree
	 */
	exitThenStatement?: (ctx: ThenStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.compoundStatementList`.
	 * @param ctx the parse tree
	 */
	enterCompoundStatementList?: (ctx: CompoundStatementListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.compoundStatementList`.
	 * @param ctx the parse tree
	 */
	exitCompoundStatementList?: (ctx: CompoundStatementListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.caseStatement`.
	 * @param ctx the parse tree
	 */
	enterCaseStatement?: (ctx: CaseStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.caseStatement`.
	 * @param ctx the parse tree
	 */
	exitCaseStatement?: (ctx: CaseStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.elseStatement`.
	 * @param ctx the parse tree
	 */
	enterElseStatement?: (ctx: ElseStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.elseStatement`.
	 * @param ctx the parse tree
	 */
	exitElseStatement?: (ctx: ElseStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.labeledBlock`.
	 * @param ctx the parse tree
	 */
	enterLabeledBlock?: (ctx: LabeledBlockContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.labeledBlock`.
	 * @param ctx the parse tree
	 */
	exitLabeledBlock?: (ctx: LabeledBlockContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.unlabeledBlock`.
	 * @param ctx the parse tree
	 */
	enterUnlabeledBlock?: (ctx: UnlabeledBlockContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.unlabeledBlock`.
	 * @param ctx the parse tree
	 */
	exitUnlabeledBlock?: (ctx: UnlabeledBlockContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.label`.
	 * @param ctx the parse tree
	 */
	enterLabel?: (ctx: LabelContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.label`.
	 * @param ctx the parse tree
	 */
	exitLabel?: (ctx: LabelContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.beginEndBlock`.
	 * @param ctx the parse tree
	 */
	enterBeginEndBlock?: (ctx: BeginEndBlockContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.beginEndBlock`.
	 * @param ctx the parse tree
	 */
	exitBeginEndBlock?: (ctx: BeginEndBlockContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.labeledControl`.
	 * @param ctx the parse tree
	 */
	enterLabeledControl?: (ctx: LabeledControlContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.labeledControl`.
	 * @param ctx the parse tree
	 */
	exitLabeledControl?: (ctx: LabeledControlContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.unlabeledControl`.
	 * @param ctx the parse tree
	 */
	enterUnlabeledControl?: (ctx: UnlabeledControlContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.unlabeledControl`.
	 * @param ctx the parse tree
	 */
	exitUnlabeledControl?: (ctx: UnlabeledControlContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.loopBlock`.
	 * @param ctx the parse tree
	 */
	enterLoopBlock?: (ctx: LoopBlockContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.loopBlock`.
	 * @param ctx the parse tree
	 */
	exitLoopBlock?: (ctx: LoopBlockContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.whileDoBlock`.
	 * @param ctx the parse tree
	 */
	enterWhileDoBlock?: (ctx: WhileDoBlockContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.whileDoBlock`.
	 * @param ctx the parse tree
	 */
	exitWhileDoBlock?: (ctx: WhileDoBlockContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.repeatUntilBlock`.
	 * @param ctx the parse tree
	 */
	enterRepeatUntilBlock?: (ctx: RepeatUntilBlockContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.repeatUntilBlock`.
	 * @param ctx the parse tree
	 */
	exitRepeatUntilBlock?: (ctx: RepeatUntilBlockContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.spDeclarations`.
	 * @param ctx the parse tree
	 */
	enterSpDeclarations?: (ctx: SpDeclarationsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.spDeclarations`.
	 * @param ctx the parse tree
	 */
	exitSpDeclarations?: (ctx: SpDeclarationsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.spDeclaration`.
	 * @param ctx the parse tree
	 */
	enterSpDeclaration?: (ctx: SpDeclarationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.spDeclaration`.
	 * @param ctx the parse tree
	 */
	exitSpDeclaration?: (ctx: SpDeclarationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.variableDeclaration`.
	 * @param ctx the parse tree
	 */
	enterVariableDeclaration?: (ctx: VariableDeclarationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.variableDeclaration`.
	 * @param ctx the parse tree
	 */
	exitVariableDeclaration?: (ctx: VariableDeclarationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.conditionDeclaration`.
	 * @param ctx the parse tree
	 */
	enterConditionDeclaration?: (ctx: ConditionDeclarationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.conditionDeclaration`.
	 * @param ctx the parse tree
	 */
	exitConditionDeclaration?: (ctx: ConditionDeclarationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.spCondition`.
	 * @param ctx the parse tree
	 */
	enterSpCondition?: (ctx: SpConditionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.spCondition`.
	 * @param ctx the parse tree
	 */
	exitSpCondition?: (ctx: SpConditionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.sqlstate`.
	 * @param ctx the parse tree
	 */
	enterSqlstate?: (ctx: SqlstateContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.sqlstate`.
	 * @param ctx the parse tree
	 */
	exitSqlstate?: (ctx: SqlstateContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.handlerDeclaration`.
	 * @param ctx the parse tree
	 */
	enterHandlerDeclaration?: (ctx: HandlerDeclarationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.handlerDeclaration`.
	 * @param ctx the parse tree
	 */
	exitHandlerDeclaration?: (ctx: HandlerDeclarationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.handlerCondition`.
	 * @param ctx the parse tree
	 */
	enterHandlerCondition?: (ctx: HandlerConditionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.handlerCondition`.
	 * @param ctx the parse tree
	 */
	exitHandlerCondition?: (ctx: HandlerConditionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.cursorDeclaration`.
	 * @param ctx the parse tree
	 */
	enterCursorDeclaration?: (ctx: CursorDeclarationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.cursorDeclaration`.
	 * @param ctx the parse tree
	 */
	exitCursorDeclaration?: (ctx: CursorDeclarationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.iterateStatement`.
	 * @param ctx the parse tree
	 */
	enterIterateStatement?: (ctx: IterateStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.iterateStatement`.
	 * @param ctx the parse tree
	 */
	exitIterateStatement?: (ctx: IterateStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.leaveStatement`.
	 * @param ctx the parse tree
	 */
	enterLeaveStatement?: (ctx: LeaveStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.leaveStatement`.
	 * @param ctx the parse tree
	 */
	exitLeaveStatement?: (ctx: LeaveStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.getDiagnostics`.
	 * @param ctx the parse tree
	 */
	enterGetDiagnostics?: (ctx: GetDiagnosticsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.getDiagnostics`.
	 * @param ctx the parse tree
	 */
	exitGetDiagnostics?: (ctx: GetDiagnosticsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.signalAllowedExpr`.
	 * @param ctx the parse tree
	 */
	enterSignalAllowedExpr?: (ctx: SignalAllowedExprContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.signalAllowedExpr`.
	 * @param ctx the parse tree
	 */
	exitSignalAllowedExpr?: (ctx: SignalAllowedExprContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.statementInformationItem`.
	 * @param ctx the parse tree
	 */
	enterStatementInformationItem?: (ctx: StatementInformationItemContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.statementInformationItem`.
	 * @param ctx the parse tree
	 */
	exitStatementInformationItem?: (ctx: StatementInformationItemContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.conditionInformationItem`.
	 * @param ctx the parse tree
	 */
	enterConditionInformationItem?: (ctx: ConditionInformationItemContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.conditionInformationItem`.
	 * @param ctx the parse tree
	 */
	exitConditionInformationItem?: (ctx: ConditionInformationItemContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.signalInformationItemName`.
	 * @param ctx the parse tree
	 */
	enterSignalInformationItemName?: (ctx: SignalInformationItemNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.signalInformationItemName`.
	 * @param ctx the parse tree
	 */
	exitSignalInformationItemName?: (ctx: SignalInformationItemNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.signalStatement`.
	 * @param ctx the parse tree
	 */
	enterSignalStatement?: (ctx: SignalStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.signalStatement`.
	 * @param ctx the parse tree
	 */
	exitSignalStatement?: (ctx: SignalStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.resignalStatement`.
	 * @param ctx the parse tree
	 */
	enterResignalStatement?: (ctx: ResignalStatementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.resignalStatement`.
	 * @param ctx the parse tree
	 */
	exitResignalStatement?: (ctx: ResignalStatementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.signalInformationItem`.
	 * @param ctx the parse tree
	 */
	enterSignalInformationItem?: (ctx: SignalInformationItemContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.signalInformationItem`.
	 * @param ctx the parse tree
	 */
	exitSignalInformationItem?: (ctx: SignalInformationItemContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.cursorOpen`.
	 * @param ctx the parse tree
	 */
	enterCursorOpen?: (ctx: CursorOpenContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.cursorOpen`.
	 * @param ctx the parse tree
	 */
	exitCursorOpen?: (ctx: CursorOpenContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.cursorClose`.
	 * @param ctx the parse tree
	 */
	enterCursorClose?: (ctx: CursorCloseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.cursorClose`.
	 * @param ctx the parse tree
	 */
	exitCursorClose?: (ctx: CursorCloseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.cursorFetch`.
	 * @param ctx the parse tree
	 */
	enterCursorFetch?: (ctx: CursorFetchContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.cursorFetch`.
	 * @param ctx the parse tree
	 */
	exitCursorFetch?: (ctx: CursorFetchContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.schedule`.
	 * @param ctx the parse tree
	 */
	enterSchedule?: (ctx: ScheduleContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.schedule`.
	 * @param ctx the parse tree
	 */
	exitSchedule?: (ctx: ScheduleContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.columnDefinition`.
	 * @param ctx the parse tree
	 */
	enterColumnDefinition?: (ctx: ColumnDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.columnDefinition`.
	 * @param ctx the parse tree
	 */
	exitColumnDefinition?: (ctx: ColumnDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.checkOrReferences`.
	 * @param ctx the parse tree
	 */
	enterCheckOrReferences?: (ctx: CheckOrReferencesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.checkOrReferences`.
	 * @param ctx the parse tree
	 */
	exitCheckOrReferences?: (ctx: CheckOrReferencesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.checkConstraint`.
	 * @param ctx the parse tree
	 */
	enterCheckConstraint?: (ctx: CheckConstraintContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.checkConstraint`.
	 * @param ctx the parse tree
	 */
	exitCheckConstraint?: (ctx: CheckConstraintContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.constraintEnforcement`.
	 * @param ctx the parse tree
	 */
	enterConstraintEnforcement?: (ctx: ConstraintEnforcementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.constraintEnforcement`.
	 * @param ctx the parse tree
	 */
	exitConstraintEnforcement?: (ctx: ConstraintEnforcementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableConstraintDef`.
	 * @param ctx the parse tree
	 */
	enterTableConstraintDef?: (ctx: TableConstraintDefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableConstraintDef`.
	 * @param ctx the parse tree
	 */
	exitTableConstraintDef?: (ctx: TableConstraintDefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.constraintName`.
	 * @param ctx the parse tree
	 */
	enterConstraintName?: (ctx: ConstraintNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.constraintName`.
	 * @param ctx the parse tree
	 */
	exitConstraintName?: (ctx: ConstraintNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fieldDefinition`.
	 * @param ctx the parse tree
	 */
	enterFieldDefinition?: (ctx: FieldDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fieldDefinition`.
	 * @param ctx the parse tree
	 */
	exitFieldDefinition?: (ctx: FieldDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.columnAttribute`.
	 * @param ctx the parse tree
	 */
	enterColumnAttribute?: (ctx: ColumnAttributeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.columnAttribute`.
	 * @param ctx the parse tree
	 */
	exitColumnAttribute?: (ctx: ColumnAttributeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.columnFormat`.
	 * @param ctx the parse tree
	 */
	enterColumnFormat?: (ctx: ColumnFormatContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.columnFormat`.
	 * @param ctx the parse tree
	 */
	exitColumnFormat?: (ctx: ColumnFormatContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.storageMedia`.
	 * @param ctx the parse tree
	 */
	enterStorageMedia?: (ctx: StorageMediaContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.storageMedia`.
	 * @param ctx the parse tree
	 */
	exitStorageMedia?: (ctx: StorageMediaContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.gcolAttribute`.
	 * @param ctx the parse tree
	 */
	enterGcolAttribute?: (ctx: GcolAttributeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.gcolAttribute`.
	 * @param ctx the parse tree
	 */
	exitGcolAttribute?: (ctx: GcolAttributeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.references`.
	 * @param ctx the parse tree
	 */
	enterReferences?: (ctx: ReferencesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.references`.
	 * @param ctx the parse tree
	 */
	exitReferences?: (ctx: ReferencesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.deleteOption`.
	 * @param ctx the parse tree
	 */
	enterDeleteOption?: (ctx: DeleteOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.deleteOption`.
	 * @param ctx the parse tree
	 */
	exitDeleteOption?: (ctx: DeleteOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyList`.
	 * @param ctx the parse tree
	 */
	enterKeyList?: (ctx: KeyListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyList`.
	 * @param ctx the parse tree
	 */
	exitKeyList?: (ctx: KeyListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyPart`.
	 * @param ctx the parse tree
	 */
	enterKeyPart?: (ctx: KeyPartContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyPart`.
	 * @param ctx the parse tree
	 */
	exitKeyPart?: (ctx: KeyPartContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyListWithExpression`.
	 * @param ctx the parse tree
	 */
	enterKeyListWithExpression?: (ctx: KeyListWithExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyListWithExpression`.
	 * @param ctx the parse tree
	 */
	exitKeyListWithExpression?: (ctx: KeyListWithExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyPartOrExpression`.
	 * @param ctx the parse tree
	 */
	enterKeyPartOrExpression?: (ctx: KeyPartOrExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyPartOrExpression`.
	 * @param ctx the parse tree
	 */
	exitKeyPartOrExpression?: (ctx: KeyPartOrExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.keyListVariants`.
	 * @param ctx the parse tree
	 */
	enterKeyListVariants?: (ctx: KeyListVariantsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.keyListVariants`.
	 * @param ctx the parse tree
	 */
	exitKeyListVariants?: (ctx: KeyListVariantsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexType`.
	 * @param ctx the parse tree
	 */
	enterIndexType?: (ctx: IndexTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexType`.
	 * @param ctx the parse tree
	 */
	exitIndexType?: (ctx: IndexTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexOption`.
	 * @param ctx the parse tree
	 */
	enterIndexOption?: (ctx: IndexOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexOption`.
	 * @param ctx the parse tree
	 */
	exitIndexOption?: (ctx: IndexOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.commonIndexOption`.
	 * @param ctx the parse tree
	 */
	enterCommonIndexOption?: (ctx: CommonIndexOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.commonIndexOption`.
	 * @param ctx the parse tree
	 */
	exitCommonIndexOption?: (ctx: CommonIndexOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.visibility`.
	 * @param ctx the parse tree
	 */
	enterVisibility?: (ctx: VisibilityContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.visibility`.
	 * @param ctx the parse tree
	 */
	exitVisibility?: (ctx: VisibilityContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexTypeClause`.
	 * @param ctx the parse tree
	 */
	enterIndexTypeClause?: (ctx: IndexTypeClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexTypeClause`.
	 * @param ctx the parse tree
	 */
	exitIndexTypeClause?: (ctx: IndexTypeClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fulltextIndexOption`.
	 * @param ctx the parse tree
	 */
	enterFulltextIndexOption?: (ctx: FulltextIndexOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fulltextIndexOption`.
	 * @param ctx the parse tree
	 */
	exitFulltextIndexOption?: (ctx: FulltextIndexOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.spatialIndexOption`.
	 * @param ctx the parse tree
	 */
	enterSpatialIndexOption?: (ctx: SpatialIndexOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.spatialIndexOption`.
	 * @param ctx the parse tree
	 */
	exitSpatialIndexOption?: (ctx: SpatialIndexOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dataTypeDefinition`.
	 * @param ctx the parse tree
	 */
	enterDataTypeDefinition?: (ctx: DataTypeDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dataTypeDefinition`.
	 * @param ctx the parse tree
	 */
	exitDataTypeDefinition?: (ctx: DataTypeDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dataType`.
	 * @param ctx the parse tree
	 */
	enterDataType?: (ctx: DataTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dataType`.
	 * @param ctx the parse tree
	 */
	exitDataType?: (ctx: DataTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.nchar`.
	 * @param ctx the parse tree
	 */
	enterNchar?: (ctx: NcharContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.nchar`.
	 * @param ctx the parse tree
	 */
	exitNchar?: (ctx: NcharContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.realType`.
	 * @param ctx the parse tree
	 */
	enterRealType?: (ctx: RealTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.realType`.
	 * @param ctx the parse tree
	 */
	exitRealType?: (ctx: RealTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fieldLength`.
	 * @param ctx the parse tree
	 */
	enterFieldLength?: (ctx: FieldLengthContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fieldLength`.
	 * @param ctx the parse tree
	 */
	exitFieldLength?: (ctx: FieldLengthContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fieldOptions`.
	 * @param ctx the parse tree
	 */
	enterFieldOptions?: (ctx: FieldOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fieldOptions`.
	 * @param ctx the parse tree
	 */
	exitFieldOptions?: (ctx: FieldOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.charsetWithOptBinary`.
	 * @param ctx the parse tree
	 */
	enterCharsetWithOptBinary?: (ctx: CharsetWithOptBinaryContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.charsetWithOptBinary`.
	 * @param ctx the parse tree
	 */
	exitCharsetWithOptBinary?: (ctx: CharsetWithOptBinaryContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.ascii`.
	 * @param ctx the parse tree
	 */
	enterAscii?: (ctx: AsciiContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.ascii`.
	 * @param ctx the parse tree
	 */
	exitAscii?: (ctx: AsciiContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.unicode`.
	 * @param ctx the parse tree
	 */
	enterUnicode?: (ctx: UnicodeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.unicode`.
	 * @param ctx the parse tree
	 */
	exitUnicode?: (ctx: UnicodeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.wsNumCodepoints`.
	 * @param ctx the parse tree
	 */
	enterWsNumCodepoints?: (ctx: WsNumCodepointsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.wsNumCodepoints`.
	 * @param ctx the parse tree
	 */
	exitWsNumCodepoints?: (ctx: WsNumCodepointsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.typeDatetimePrecision`.
	 * @param ctx the parse tree
	 */
	enterTypeDatetimePrecision?: (ctx: TypeDatetimePrecisionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.typeDatetimePrecision`.
	 * @param ctx the parse tree
	 */
	exitTypeDatetimePrecision?: (ctx: TypeDatetimePrecisionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.charsetName`.
	 * @param ctx the parse tree
	 */
	enterCharsetName?: (ctx: CharsetNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.charsetName`.
	 * @param ctx the parse tree
	 */
	exitCharsetName?: (ctx: CharsetNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.collationName`.
	 * @param ctx the parse tree
	 */
	enterCollationName?: (ctx: CollationNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.collationName`.
	 * @param ctx the parse tree
	 */
	exitCollationName?: (ctx: CollationNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createTableOptions`.
	 * @param ctx the parse tree
	 */
	enterCreateTableOptions?: (ctx: CreateTableOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createTableOptions`.
	 * @param ctx the parse tree
	 */
	exitCreateTableOptions?: (ctx: CreateTableOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createTableOptionsSpaceSeparated`.
	 * @param ctx the parse tree
	 */
	enterCreateTableOptionsSpaceSeparated?: (ctx: CreateTableOptionsSpaceSeparatedContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createTableOptionsSpaceSeparated`.
	 * @param ctx the parse tree
	 */
	exitCreateTableOptionsSpaceSeparated?: (ctx: CreateTableOptionsSpaceSeparatedContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createTableOption`.
	 * @param ctx the parse tree
	 */
	enterCreateTableOption?: (ctx: CreateTableOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createTableOption`.
	 * @param ctx the parse tree
	 */
	exitCreateTableOption?: (ctx: CreateTableOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.ternaryOption`.
	 * @param ctx the parse tree
	 */
	enterTernaryOption?: (ctx: TernaryOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.ternaryOption`.
	 * @param ctx the parse tree
	 */
	exitTernaryOption?: (ctx: TernaryOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.defaultCollation`.
	 * @param ctx the parse tree
	 */
	enterDefaultCollation?: (ctx: DefaultCollationContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.defaultCollation`.
	 * @param ctx the parse tree
	 */
	exitDefaultCollation?: (ctx: DefaultCollationContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.defaultEncryption`.
	 * @param ctx the parse tree
	 */
	enterDefaultEncryption?: (ctx: DefaultEncryptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.defaultEncryption`.
	 * @param ctx the parse tree
	 */
	exitDefaultEncryption?: (ctx: DefaultEncryptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.defaultCharset`.
	 * @param ctx the parse tree
	 */
	enterDefaultCharset?: (ctx: DefaultCharsetContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.defaultCharset`.
	 * @param ctx the parse tree
	 */
	exitDefaultCharset?: (ctx: DefaultCharsetContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionClause`.
	 * @param ctx the parse tree
	 */
	enterPartitionClause?: (ctx: PartitionClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionClause`.
	 * @param ctx the parse tree
	 */
	exitPartitionClause?: (ctx: PartitionClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionTypeDef`.
	 * @param ctx the parse tree
	 */
	enterPartitionTypeDef?: (ctx: PartitionTypeDefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionTypeDef`.
	 * @param ctx the parse tree
	 */
	exitPartitionTypeDef?: (ctx: PartitionTypeDefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.subPartitions`.
	 * @param ctx the parse tree
	 */
	enterSubPartitions?: (ctx: SubPartitionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.subPartitions`.
	 * @param ctx the parse tree
	 */
	exitSubPartitions?: (ctx: SubPartitionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionKeyAlgorithm`.
	 * @param ctx the parse tree
	 */
	enterPartitionKeyAlgorithm?: (ctx: PartitionKeyAlgorithmContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionKeyAlgorithm`.
	 * @param ctx the parse tree
	 */
	exitPartitionKeyAlgorithm?: (ctx: PartitionKeyAlgorithmContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionDefinitions`.
	 * @param ctx the parse tree
	 */
	enterPartitionDefinitions?: (ctx: PartitionDefinitionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionDefinitions`.
	 * @param ctx the parse tree
	 */
	exitPartitionDefinitions?: (ctx: PartitionDefinitionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionDefinition`.
	 * @param ctx the parse tree
	 */
	enterPartitionDefinition?: (ctx: PartitionDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionDefinition`.
	 * @param ctx the parse tree
	 */
	exitPartitionDefinition?: (ctx: PartitionDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionValuesIn`.
	 * @param ctx the parse tree
	 */
	enterPartitionValuesIn?: (ctx: PartitionValuesInContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionValuesIn`.
	 * @param ctx the parse tree
	 */
	exitPartitionValuesIn?: (ctx: PartitionValuesInContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionOption`.
	 * @param ctx the parse tree
	 */
	enterPartitionOption?: (ctx: PartitionOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionOption`.
	 * @param ctx the parse tree
	 */
	exitPartitionOption?: (ctx: PartitionOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.subpartitionDefinition`.
	 * @param ctx the parse tree
	 */
	enterSubpartitionDefinition?: (ctx: SubpartitionDefinitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.subpartitionDefinition`.
	 * @param ctx the parse tree
	 */
	exitSubpartitionDefinition?: (ctx: SubpartitionDefinitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionValueItemListParen`.
	 * @param ctx the parse tree
	 */
	enterPartitionValueItemListParen?: (ctx: PartitionValueItemListParenContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionValueItemListParen`.
	 * @param ctx the parse tree
	 */
	exitPartitionValueItemListParen?: (ctx: PartitionValueItemListParenContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.partitionValueItem`.
	 * @param ctx the parse tree
	 */
	enterPartitionValueItem?: (ctx: PartitionValueItemContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.partitionValueItem`.
	 * @param ctx the parse tree
	 */
	exitPartitionValueItem?: (ctx: PartitionValueItemContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.definerClause`.
	 * @param ctx the parse tree
	 */
	enterDefinerClause?: (ctx: DefinerClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.definerClause`.
	 * @param ctx the parse tree
	 */
	exitDefinerClause?: (ctx: DefinerClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.ifExists`.
	 * @param ctx the parse tree
	 */
	enterIfExists?: (ctx: IfExistsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.ifExists`.
	 * @param ctx the parse tree
	 */
	exitIfExists?: (ctx: IfExistsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.ifNotExists`.
	 * @param ctx the parse tree
	 */
	enterIfNotExists?: (ctx: IfNotExistsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.ifNotExists`.
	 * @param ctx the parse tree
	 */
	exitIfNotExists?: (ctx: IfNotExistsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.procedureParameter`.
	 * @param ctx the parse tree
	 */
	enterProcedureParameter?: (ctx: ProcedureParameterContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.procedureParameter`.
	 * @param ctx the parse tree
	 */
	exitProcedureParameter?: (ctx: ProcedureParameterContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.functionParameter`.
	 * @param ctx the parse tree
	 */
	enterFunctionParameter?: (ctx: FunctionParameterContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.functionParameter`.
	 * @param ctx the parse tree
	 */
	exitFunctionParameter?: (ctx: FunctionParameterContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.collate`.
	 * @param ctx the parse tree
	 */
	enterCollate?: (ctx: CollateContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.collate`.
	 * @param ctx the parse tree
	 */
	exitCollate?: (ctx: CollateContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.typeWithOptCollate`.
	 * @param ctx the parse tree
	 */
	enterTypeWithOptCollate?: (ctx: TypeWithOptCollateContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.typeWithOptCollate`.
	 * @param ctx the parse tree
	 */
	exitTypeWithOptCollate?: (ctx: TypeWithOptCollateContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.schemaIdentifierPair`.
	 * @param ctx the parse tree
	 */
	enterSchemaIdentifierPair?: (ctx: SchemaIdentifierPairContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.schemaIdentifierPair`.
	 * @param ctx the parse tree
	 */
	exitSchemaIdentifierPair?: (ctx: SchemaIdentifierPairContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.viewRefList`.
	 * @param ctx the parse tree
	 */
	enterViewRefList?: (ctx: ViewRefListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.viewRefList`.
	 * @param ctx the parse tree
	 */
	exitViewRefList?: (ctx: ViewRefListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.updateList`.
	 * @param ctx the parse tree
	 */
	enterUpdateList?: (ctx: UpdateListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.updateList`.
	 * @param ctx the parse tree
	 */
	exitUpdateList?: (ctx: UpdateListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.updateElement`.
	 * @param ctx the parse tree
	 */
	enterUpdateElement?: (ctx: UpdateElementContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.updateElement`.
	 * @param ctx the parse tree
	 */
	exitUpdateElement?: (ctx: UpdateElementContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.charsetClause`.
	 * @param ctx the parse tree
	 */
	enterCharsetClause?: (ctx: CharsetClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.charsetClause`.
	 * @param ctx the parse tree
	 */
	exitCharsetClause?: (ctx: CharsetClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fieldsClause`.
	 * @param ctx the parse tree
	 */
	enterFieldsClause?: (ctx: FieldsClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fieldsClause`.
	 * @param ctx the parse tree
	 */
	exitFieldsClause?: (ctx: FieldsClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fieldTerm`.
	 * @param ctx the parse tree
	 */
	enterFieldTerm?: (ctx: FieldTermContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fieldTerm`.
	 * @param ctx the parse tree
	 */
	exitFieldTerm?: (ctx: FieldTermContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.linesClause`.
	 * @param ctx the parse tree
	 */
	enterLinesClause?: (ctx: LinesClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.linesClause`.
	 * @param ctx the parse tree
	 */
	exitLinesClause?: (ctx: LinesClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.lineTerm`.
	 * @param ctx the parse tree
	 */
	enterLineTerm?: (ctx: LineTermContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.lineTerm`.
	 * @param ctx the parse tree
	 */
	exitLineTerm?: (ctx: LineTermContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.userList`.
	 * @param ctx the parse tree
	 */
	enterUserList?: (ctx: UserListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.userList`.
	 * @param ctx the parse tree
	 */
	exitUserList?: (ctx: UserListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createUserList`.
	 * @param ctx the parse tree
	 */
	enterCreateUserList?: (ctx: CreateUserListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createUserList`.
	 * @param ctx the parse tree
	 */
	exitCreateUserList?: (ctx: CreateUserListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterUserList`.
	 * @param ctx the parse tree
	 */
	enterAlterUserList?: (ctx: AlterUserListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterUserList`.
	 * @param ctx the parse tree
	 */
	exitAlterUserList?: (ctx: AlterUserListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.createUserEntry`.
	 * @param ctx the parse tree
	 */
	enterCreateUserEntry?: (ctx: CreateUserEntryContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.createUserEntry`.
	 * @param ctx the parse tree
	 */
	exitCreateUserEntry?: (ctx: CreateUserEntryContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.alterUserEntry`.
	 * @param ctx the parse tree
	 */
	enterAlterUserEntry?: (ctx: AlterUserEntryContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.alterUserEntry`.
	 * @param ctx the parse tree
	 */
	exitAlterUserEntry?: (ctx: AlterUserEntryContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.retainCurrentPassword`.
	 * @param ctx the parse tree
	 */
	enterRetainCurrentPassword?: (ctx: RetainCurrentPasswordContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.retainCurrentPassword`.
	 * @param ctx the parse tree
	 */
	exitRetainCurrentPassword?: (ctx: RetainCurrentPasswordContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.discardOldPassword`.
	 * @param ctx the parse tree
	 */
	enterDiscardOldPassword?: (ctx: DiscardOldPasswordContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.discardOldPassword`.
	 * @param ctx the parse tree
	 */
	exitDiscardOldPassword?: (ctx: DiscardOldPasswordContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.replacePassword`.
	 * @param ctx the parse tree
	 */
	enterReplacePassword?: (ctx: ReplacePasswordContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.replacePassword`.
	 * @param ctx the parse tree
	 */
	exitReplacePassword?: (ctx: ReplacePasswordContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.userIdentifierOrText`.
	 * @param ctx the parse tree
	 */
	enterUserIdentifierOrText?: (ctx: UserIdentifierOrTextContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.userIdentifierOrText`.
	 * @param ctx the parse tree
	 */
	exitUserIdentifierOrText?: (ctx: UserIdentifierOrTextContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.user`.
	 * @param ctx the parse tree
	 */
	enterUser?: (ctx: UserContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.user`.
	 * @param ctx the parse tree
	 */
	exitUser?: (ctx: UserContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.likeClause`.
	 * @param ctx the parse tree
	 */
	enterLikeClause?: (ctx: LikeClauseContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.likeClause`.
	 * @param ctx the parse tree
	 */
	exitLikeClause?: (ctx: LikeClauseContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.likeOrWhere`.
	 * @param ctx the parse tree
	 */
	enterLikeOrWhere?: (ctx: LikeOrWhereContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.likeOrWhere`.
	 * @param ctx the parse tree
	 */
	exitLikeOrWhere?: (ctx: LikeOrWhereContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.onlineOption`.
	 * @param ctx the parse tree
	 */
	enterOnlineOption?: (ctx: OnlineOptionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.onlineOption`.
	 * @param ctx the parse tree
	 */
	exitOnlineOption?: (ctx: OnlineOptionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.noWriteToBinLog`.
	 * @param ctx the parse tree
	 */
	enterNoWriteToBinLog?: (ctx: NoWriteToBinLogContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.noWriteToBinLog`.
	 * @param ctx the parse tree
	 */
	exitNoWriteToBinLog?: (ctx: NoWriteToBinLogContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.usePartition`.
	 * @param ctx the parse tree
	 */
	enterUsePartition?: (ctx: UsePartitionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.usePartition`.
	 * @param ctx the parse tree
	 */
	exitUsePartition?: (ctx: UsePartitionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.fieldIdentifier`.
	 * @param ctx the parse tree
	 */
	enterFieldIdentifier?: (ctx: FieldIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.fieldIdentifier`.
	 * @param ctx the parse tree
	 */
	exitFieldIdentifier?: (ctx: FieldIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.columnName`.
	 * @param ctx the parse tree
	 */
	enterColumnName?: (ctx: ColumnNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.columnName`.
	 * @param ctx the parse tree
	 */
	exitColumnName?: (ctx: ColumnNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.columnInternalRef`.
	 * @param ctx the parse tree
	 */
	enterColumnInternalRef?: (ctx: ColumnInternalRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.columnInternalRef`.
	 * @param ctx the parse tree
	 */
	exitColumnInternalRef?: (ctx: ColumnInternalRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.columnInternalRefList`.
	 * @param ctx the parse tree
	 */
	enterColumnInternalRefList?: (ctx: ColumnInternalRefListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.columnInternalRefList`.
	 * @param ctx the parse tree
	 */
	exitColumnInternalRefList?: (ctx: ColumnInternalRefListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.columnRef`.
	 * @param ctx the parse tree
	 */
	enterColumnRef?: (ctx: ColumnRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.columnRef`.
	 * @param ctx the parse tree
	 */
	exitColumnRef?: (ctx: ColumnRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.insertIdentifier`.
	 * @param ctx the parse tree
	 */
	enterInsertIdentifier?: (ctx: InsertIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.insertIdentifier`.
	 * @param ctx the parse tree
	 */
	exitInsertIdentifier?: (ctx: InsertIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexName`.
	 * @param ctx the parse tree
	 */
	enterIndexName?: (ctx: IndexNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexName`.
	 * @param ctx the parse tree
	 */
	exitIndexName?: (ctx: IndexNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.indexRef`.
	 * @param ctx the parse tree
	 */
	enterIndexRef?: (ctx: IndexRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.indexRef`.
	 * @param ctx the parse tree
	 */
	exitIndexRef?: (ctx: IndexRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableWild`.
	 * @param ctx the parse tree
	 */
	enterTableWild?: (ctx: TableWildContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableWild`.
	 * @param ctx the parse tree
	 */
	exitTableWild?: (ctx: TableWildContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.schemaName`.
	 * @param ctx the parse tree
	 */
	enterSchemaName?: (ctx: SchemaNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.schemaName`.
	 * @param ctx the parse tree
	 */
	exitSchemaName?: (ctx: SchemaNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.schemaRef`.
	 * @param ctx the parse tree
	 */
	enterSchemaRef?: (ctx: SchemaRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.schemaRef`.
	 * @param ctx the parse tree
	 */
	exitSchemaRef?: (ctx: SchemaRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.procedureName`.
	 * @param ctx the parse tree
	 */
	enterProcedureName?: (ctx: ProcedureNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.procedureName`.
	 * @param ctx the parse tree
	 */
	exitProcedureName?: (ctx: ProcedureNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.procedureRef`.
	 * @param ctx the parse tree
	 */
	enterProcedureRef?: (ctx: ProcedureRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.procedureRef`.
	 * @param ctx the parse tree
	 */
	exitProcedureRef?: (ctx: ProcedureRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.functionName`.
	 * @param ctx the parse tree
	 */
	enterFunctionName?: (ctx: FunctionNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.functionName`.
	 * @param ctx the parse tree
	 */
	exitFunctionName?: (ctx: FunctionNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.functionRef`.
	 * @param ctx the parse tree
	 */
	enterFunctionRef?: (ctx: FunctionRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.functionRef`.
	 * @param ctx the parse tree
	 */
	exitFunctionRef?: (ctx: FunctionRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.triggerName`.
	 * @param ctx the parse tree
	 */
	enterTriggerName?: (ctx: TriggerNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.triggerName`.
	 * @param ctx the parse tree
	 */
	exitTriggerName?: (ctx: TriggerNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.triggerRef`.
	 * @param ctx the parse tree
	 */
	enterTriggerRef?: (ctx: TriggerRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.triggerRef`.
	 * @param ctx the parse tree
	 */
	exitTriggerRef?: (ctx: TriggerRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.viewName`.
	 * @param ctx the parse tree
	 */
	enterViewName?: (ctx: ViewNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.viewName`.
	 * @param ctx the parse tree
	 */
	exitViewName?: (ctx: ViewNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.viewRef`.
	 * @param ctx the parse tree
	 */
	enterViewRef?: (ctx: ViewRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.viewRef`.
	 * @param ctx the parse tree
	 */
	exitViewRef?: (ctx: ViewRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tablespaceName`.
	 * @param ctx the parse tree
	 */
	enterTablespaceName?: (ctx: TablespaceNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tablespaceName`.
	 * @param ctx the parse tree
	 */
	exitTablespaceName?: (ctx: TablespaceNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tablespaceRef`.
	 * @param ctx the parse tree
	 */
	enterTablespaceRef?: (ctx: TablespaceRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tablespaceRef`.
	 * @param ctx the parse tree
	 */
	exitTablespaceRef?: (ctx: TablespaceRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.logfileGroupName`.
	 * @param ctx the parse tree
	 */
	enterLogfileGroupName?: (ctx: LogfileGroupNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.logfileGroupName`.
	 * @param ctx the parse tree
	 */
	exitLogfileGroupName?: (ctx: LogfileGroupNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.logfileGroupRef`.
	 * @param ctx the parse tree
	 */
	enterLogfileGroupRef?: (ctx: LogfileGroupRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.logfileGroupRef`.
	 * @param ctx the parse tree
	 */
	exitLogfileGroupRef?: (ctx: LogfileGroupRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.eventName`.
	 * @param ctx the parse tree
	 */
	enterEventName?: (ctx: EventNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.eventName`.
	 * @param ctx the parse tree
	 */
	exitEventName?: (ctx: EventNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.eventRef`.
	 * @param ctx the parse tree
	 */
	enterEventRef?: (ctx: EventRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.eventRef`.
	 * @param ctx the parse tree
	 */
	exitEventRef?: (ctx: EventRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.udfName`.
	 * @param ctx the parse tree
	 */
	enterUdfName?: (ctx: UdfNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.udfName`.
	 * @param ctx the parse tree
	 */
	exitUdfName?: (ctx: UdfNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.serverName`.
	 * @param ctx the parse tree
	 */
	enterServerName?: (ctx: ServerNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.serverName`.
	 * @param ctx the parse tree
	 */
	exitServerName?: (ctx: ServerNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.serverRef`.
	 * @param ctx the parse tree
	 */
	enterServerRef?: (ctx: ServerRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.serverRef`.
	 * @param ctx the parse tree
	 */
	exitServerRef?: (ctx: ServerRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.engineRef`.
	 * @param ctx the parse tree
	 */
	enterEngineRef?: (ctx: EngineRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.engineRef`.
	 * @param ctx the parse tree
	 */
	exitEngineRef?: (ctx: EngineRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableName`.
	 * @param ctx the parse tree
	 */
	enterTableName?: (ctx: TableNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableName`.
	 * @param ctx the parse tree
	 */
	exitTableName?: (ctx: TableNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.filterTableRef`.
	 * @param ctx the parse tree
	 */
	enterFilterTableRef?: (ctx: FilterTableRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.filterTableRef`.
	 * @param ctx the parse tree
	 */
	exitFilterTableRef?: (ctx: FilterTableRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableRefWithWildcard`.
	 * @param ctx the parse tree
	 */
	enterTableRefWithWildcard?: (ctx: TableRefWithWildcardContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableRefWithWildcard`.
	 * @param ctx the parse tree
	 */
	exitTableRefWithWildcard?: (ctx: TableRefWithWildcardContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableRef`.
	 * @param ctx the parse tree
	 */
	enterTableRef?: (ctx: TableRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableRef`.
	 * @param ctx the parse tree
	 */
	exitTableRef?: (ctx: TableRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableRefList`.
	 * @param ctx the parse tree
	 */
	enterTableRefList?: (ctx: TableRefListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableRefList`.
	 * @param ctx the parse tree
	 */
	exitTableRefList?: (ctx: TableRefListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.tableAliasRefList`.
	 * @param ctx the parse tree
	 */
	enterTableAliasRefList?: (ctx: TableAliasRefListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.tableAliasRefList`.
	 * @param ctx the parse tree
	 */
	exitTableAliasRefList?: (ctx: TableAliasRefListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.parameterName`.
	 * @param ctx the parse tree
	 */
	enterParameterName?: (ctx: ParameterNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.parameterName`.
	 * @param ctx the parse tree
	 */
	exitParameterName?: (ctx: ParameterNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.labelIdentifier`.
	 * @param ctx the parse tree
	 */
	enterLabelIdentifier?: (ctx: LabelIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.labelIdentifier`.
	 * @param ctx the parse tree
	 */
	exitLabelIdentifier?: (ctx: LabelIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.labelRef`.
	 * @param ctx the parse tree
	 */
	enterLabelRef?: (ctx: LabelRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.labelRef`.
	 * @param ctx the parse tree
	 */
	exitLabelRef?: (ctx: LabelRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.roleIdentifier`.
	 * @param ctx the parse tree
	 */
	enterRoleIdentifier?: (ctx: RoleIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.roleIdentifier`.
	 * @param ctx the parse tree
	 */
	exitRoleIdentifier?: (ctx: RoleIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.roleRef`.
	 * @param ctx the parse tree
	 */
	enterRoleRef?: (ctx: RoleRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.roleRef`.
	 * @param ctx the parse tree
	 */
	exitRoleRef?: (ctx: RoleRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.pluginRef`.
	 * @param ctx the parse tree
	 */
	enterPluginRef?: (ctx: PluginRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.pluginRef`.
	 * @param ctx the parse tree
	 */
	exitPluginRef?: (ctx: PluginRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.componentRef`.
	 * @param ctx the parse tree
	 */
	enterComponentRef?: (ctx: ComponentRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.componentRef`.
	 * @param ctx the parse tree
	 */
	exitComponentRef?: (ctx: ComponentRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.resourceGroupRef`.
	 * @param ctx the parse tree
	 */
	enterResourceGroupRef?: (ctx: ResourceGroupRefContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.resourceGroupRef`.
	 * @param ctx the parse tree
	 */
	exitResourceGroupRef?: (ctx: ResourceGroupRefContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.windowName`.
	 * @param ctx the parse tree
	 */
	enterWindowName?: (ctx: WindowNameContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.windowName`.
	 * @param ctx the parse tree
	 */
	exitWindowName?: (ctx: WindowNameContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.pureIdentifier`.
	 * @param ctx the parse tree
	 */
	enterPureIdentifier?: (ctx: PureIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.pureIdentifier`.
	 * @param ctx the parse tree
	 */
	exitPureIdentifier?: (ctx: PureIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identifier`.
	 * @param ctx the parse tree
	 */
	enterIdentifier?: (ctx: IdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identifier`.
	 * @param ctx the parse tree
	 */
	exitIdentifier?: (ctx: IdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identifierList`.
	 * @param ctx the parse tree
	 */
	enterIdentifierList?: (ctx: IdentifierListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identifierList`.
	 * @param ctx the parse tree
	 */
	exitIdentifierList?: (ctx: IdentifierListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identifierListWithParentheses`.
	 * @param ctx the parse tree
	 */
	enterIdentifierListWithParentheses?: (ctx: IdentifierListWithParenthesesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identifierListWithParentheses`.
	 * @param ctx the parse tree
	 */
	exitIdentifierListWithParentheses?: (ctx: IdentifierListWithParenthesesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.qualifiedIdentifier`.
	 * @param ctx the parse tree
	 */
	enterQualifiedIdentifier?: (ctx: QualifiedIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.qualifiedIdentifier`.
	 * @param ctx the parse tree
	 */
	exitQualifiedIdentifier?: (ctx: QualifiedIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.simpleIdentifier`.
	 * @param ctx the parse tree
	 */
	enterSimpleIdentifier?: (ctx: SimpleIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.simpleIdentifier`.
	 * @param ctx the parse tree
	 */
	exitSimpleIdentifier?: (ctx: SimpleIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.dotIdentifier`.
	 * @param ctx the parse tree
	 */
	enterDotIdentifier?: (ctx: DotIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.dotIdentifier`.
	 * @param ctx the parse tree
	 */
	exitDotIdentifier?: (ctx: DotIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.ulong_number`.
	 * @param ctx the parse tree
	 */
	enterUlong_number?: (ctx: Ulong_numberContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.ulong_number`.
	 * @param ctx the parse tree
	 */
	exitUlong_number?: (ctx: Ulong_numberContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.real_ulong_number`.
	 * @param ctx the parse tree
	 */
	enterReal_ulong_number?: (ctx: Real_ulong_numberContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.real_ulong_number`.
	 * @param ctx the parse tree
	 */
	exitReal_ulong_number?: (ctx: Real_ulong_numberContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.ulonglong_number`.
	 * @param ctx the parse tree
	 */
	enterUlonglong_number?: (ctx: Ulonglong_numberContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.ulonglong_number`.
	 * @param ctx the parse tree
	 */
	exitUlonglong_number?: (ctx: Ulonglong_numberContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.real_ulonglong_number`.
	 * @param ctx the parse tree
	 */
	enterReal_ulonglong_number?: (ctx: Real_ulonglong_numberContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.real_ulonglong_number`.
	 * @param ctx the parse tree
	 */
	exitReal_ulonglong_number?: (ctx: Real_ulonglong_numberContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.literal`.
	 * @param ctx the parse tree
	 */
	enterLiteral?: (ctx: LiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.literal`.
	 * @param ctx the parse tree
	 */
	exitLiteral?: (ctx: LiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.signedLiteral`.
	 * @param ctx the parse tree
	 */
	enterSignedLiteral?: (ctx: SignedLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.signedLiteral`.
	 * @param ctx the parse tree
	 */
	exitSignedLiteral?: (ctx: SignedLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.stringList`.
	 * @param ctx the parse tree
	 */
	enterStringList?: (ctx: StringListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.stringList`.
	 * @param ctx the parse tree
	 */
	exitStringList?: (ctx: StringListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.textStringLiteral`.
	 * @param ctx the parse tree
	 */
	enterTextStringLiteral?: (ctx: TextStringLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.textStringLiteral`.
	 * @param ctx the parse tree
	 */
	exitTextStringLiteral?: (ctx: TextStringLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.textString`.
	 * @param ctx the parse tree
	 */
	enterTextString?: (ctx: TextStringContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.textString`.
	 * @param ctx the parse tree
	 */
	exitTextString?: (ctx: TextStringContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.textStringHash`.
	 * @param ctx the parse tree
	 */
	enterTextStringHash?: (ctx: TextStringHashContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.textStringHash`.
	 * @param ctx the parse tree
	 */
	exitTextStringHash?: (ctx: TextStringHashContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.textLiteral`.
	 * @param ctx the parse tree
	 */
	enterTextLiteral?: (ctx: TextLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.textLiteral`.
	 * @param ctx the parse tree
	 */
	exitTextLiteral?: (ctx: TextLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.textStringNoLinebreak`.
	 * @param ctx the parse tree
	 */
	enterTextStringNoLinebreak?: (ctx: TextStringNoLinebreakContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.textStringNoLinebreak`.
	 * @param ctx the parse tree
	 */
	exitTextStringNoLinebreak?: (ctx: TextStringNoLinebreakContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.textStringLiteralList`.
	 * @param ctx the parse tree
	 */
	enterTextStringLiteralList?: (ctx: TextStringLiteralListContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.textStringLiteralList`.
	 * @param ctx the parse tree
	 */
	exitTextStringLiteralList?: (ctx: TextStringLiteralListContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.numLiteral`.
	 * @param ctx the parse tree
	 */
	enterNumLiteral?: (ctx: NumLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.numLiteral`.
	 * @param ctx the parse tree
	 */
	exitNumLiteral?: (ctx: NumLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.boolLiteral`.
	 * @param ctx the parse tree
	 */
	enterBoolLiteral?: (ctx: BoolLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.boolLiteral`.
	 * @param ctx the parse tree
	 */
	exitBoolLiteral?: (ctx: BoolLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.nullLiteral`.
	 * @param ctx the parse tree
	 */
	enterNullLiteral?: (ctx: NullLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.nullLiteral`.
	 * @param ctx the parse tree
	 */
	exitNullLiteral?: (ctx: NullLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.temporalLiteral`.
	 * @param ctx the parse tree
	 */
	enterTemporalLiteral?: (ctx: TemporalLiteralContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.temporalLiteral`.
	 * @param ctx the parse tree
	 */
	exitTemporalLiteral?: (ctx: TemporalLiteralContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.floatOptions`.
	 * @param ctx the parse tree
	 */
	enterFloatOptions?: (ctx: FloatOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.floatOptions`.
	 * @param ctx the parse tree
	 */
	exitFloatOptions?: (ctx: FloatOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.standardFloatOptions`.
	 * @param ctx the parse tree
	 */
	enterStandardFloatOptions?: (ctx: StandardFloatOptionsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.standardFloatOptions`.
	 * @param ctx the parse tree
	 */
	exitStandardFloatOptions?: (ctx: StandardFloatOptionsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.precision`.
	 * @param ctx the parse tree
	 */
	enterPrecision?: (ctx: PrecisionContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.precision`.
	 * @param ctx the parse tree
	 */
	exitPrecision?: (ctx: PrecisionContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.textOrIdentifier`.
	 * @param ctx the parse tree
	 */
	enterTextOrIdentifier?: (ctx: TextOrIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.textOrIdentifier`.
	 * @param ctx the parse tree
	 */
	exitTextOrIdentifier?: (ctx: TextOrIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.lValueIdentifier`.
	 * @param ctx the parse tree
	 */
	enterLValueIdentifier?: (ctx: LValueIdentifierContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.lValueIdentifier`.
	 * @param ctx the parse tree
	 */
	exitLValueIdentifier?: (ctx: LValueIdentifierContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.roleIdentifierOrText`.
	 * @param ctx the parse tree
	 */
	enterRoleIdentifierOrText?: (ctx: RoleIdentifierOrTextContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.roleIdentifierOrText`.
	 * @param ctx the parse tree
	 */
	exitRoleIdentifierOrText?: (ctx: RoleIdentifierOrTextContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.sizeNumber`.
	 * @param ctx the parse tree
	 */
	enterSizeNumber?: (ctx: SizeNumberContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.sizeNumber`.
	 * @param ctx the parse tree
	 */
	exitSizeNumber?: (ctx: SizeNumberContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.parentheses`.
	 * @param ctx the parse tree
	 */
	enterParentheses?: (ctx: ParenthesesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.parentheses`.
	 * @param ctx the parse tree
	 */
	exitParentheses?: (ctx: ParenthesesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.equal`.
	 * @param ctx the parse tree
	 */
	enterEqual?: (ctx: EqualContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.equal`.
	 * @param ctx the parse tree
	 */
	exitEqual?: (ctx: EqualContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.optionType`.
	 * @param ctx the parse tree
	 */
	enterOptionType?: (ctx: OptionTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.optionType`.
	 * @param ctx the parse tree
	 */
	exitOptionType?: (ctx: OptionTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.varIdentType`.
	 * @param ctx the parse tree
	 */
	enterVarIdentType?: (ctx: VarIdentTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.varIdentType`.
	 * @param ctx the parse tree
	 */
	exitVarIdentType?: (ctx: VarIdentTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.setVarIdentType`.
	 * @param ctx the parse tree
	 */
	enterSetVarIdentType?: (ctx: SetVarIdentTypeContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.setVarIdentType`.
	 * @param ctx the parse tree
	 */
	exitSetVarIdentType?: (ctx: SetVarIdentTypeContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identifierKeyword`.
	 * @param ctx the parse tree
	 */
	enterIdentifierKeyword?: (ctx: IdentifierKeywordContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identifierKeyword`.
	 * @param ctx the parse tree
	 */
	exitIdentifierKeyword?: (ctx: IdentifierKeywordContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identifierKeywordsAmbiguous1RolesAndLabels`.
	 * @param ctx the parse tree
	 */
	enterIdentifierKeywordsAmbiguous1RolesAndLabels?: (ctx: IdentifierKeywordsAmbiguous1RolesAndLabelsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identifierKeywordsAmbiguous1RolesAndLabels`.
	 * @param ctx the parse tree
	 */
	exitIdentifierKeywordsAmbiguous1RolesAndLabels?: (ctx: IdentifierKeywordsAmbiguous1RolesAndLabelsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identifierKeywordsAmbiguous2Labels`.
	 * @param ctx the parse tree
	 */
	enterIdentifierKeywordsAmbiguous2Labels?: (ctx: IdentifierKeywordsAmbiguous2LabelsContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identifierKeywordsAmbiguous2Labels`.
	 * @param ctx the parse tree
	 */
	exitIdentifierKeywordsAmbiguous2Labels?: (ctx: IdentifierKeywordsAmbiguous2LabelsContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.labelKeyword`.
	 * @param ctx the parse tree
	 */
	enterLabelKeyword?: (ctx: LabelKeywordContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.labelKeyword`.
	 * @param ctx the parse tree
	 */
	exitLabelKeyword?: (ctx: LabelKeywordContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identifierKeywordsAmbiguous3Roles`.
	 * @param ctx the parse tree
	 */
	enterIdentifierKeywordsAmbiguous3Roles?: (ctx: IdentifierKeywordsAmbiguous3RolesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identifierKeywordsAmbiguous3Roles`.
	 * @param ctx the parse tree
	 */
	exitIdentifierKeywordsAmbiguous3Roles?: (ctx: IdentifierKeywordsAmbiguous3RolesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identifierKeywordsUnambiguous`.
	 * @param ctx the parse tree
	 */
	enterIdentifierKeywordsUnambiguous?: (ctx: IdentifierKeywordsUnambiguousContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identifierKeywordsUnambiguous`.
	 * @param ctx the parse tree
	 */
	exitIdentifierKeywordsUnambiguous?: (ctx: IdentifierKeywordsUnambiguousContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.roleKeyword`.
	 * @param ctx the parse tree
	 */
	enterRoleKeyword?: (ctx: RoleKeywordContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.roleKeyword`.
	 * @param ctx the parse tree
	 */
	exitRoleKeyword?: (ctx: RoleKeywordContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.lValueKeyword`.
	 * @param ctx the parse tree
	 */
	enterLValueKeyword?: (ctx: LValueKeywordContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.lValueKeyword`.
	 * @param ctx the parse tree
	 */
	exitLValueKeyword?: (ctx: LValueKeywordContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.identifierKeywordsAmbiguous4SystemVariables`.
	 * @param ctx the parse tree
	 */
	enterIdentifierKeywordsAmbiguous4SystemVariables?: (ctx: IdentifierKeywordsAmbiguous4SystemVariablesContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.identifierKeywordsAmbiguous4SystemVariables`.
	 * @param ctx the parse tree
	 */
	exitIdentifierKeywordsAmbiguous4SystemVariables?: (ctx: IdentifierKeywordsAmbiguous4SystemVariablesContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.roleOrIdentifierKeyword`.
	 * @param ctx the parse tree
	 */
	enterRoleOrIdentifierKeyword?: (ctx: RoleOrIdentifierKeywordContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.roleOrIdentifierKeyword`.
	 * @param ctx the parse tree
	 */
	exitRoleOrIdentifierKeyword?: (ctx: RoleOrIdentifierKeywordContext) => void;

	/**
	 * Enter a parse tree produced by `MySQLParser.roleOrLabelKeyword`.
	 * @param ctx the parse tree
	 */
	enterRoleOrLabelKeyword?: (ctx: RoleOrLabelKeywordContext) => void;
	/**
	 * Exit a parse tree produced by `MySQLParser.roleOrLabelKeyword`.
	 * @param ctx the parse tree
	 */
	exitRoleOrLabelKeyword?: (ctx: RoleOrLabelKeywordContext) => void;
}

