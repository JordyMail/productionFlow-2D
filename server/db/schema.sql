-- server\db\schema.sql
-- =============================================
-- FLOW2D - DATABASE RESET & RECREATE
-- Jalankan di SSMS pada database ProcessTime_IAB
-- =============================================

USE [ProcessTime_IAB];
GO

-- =============================================
-- 1. DROP ALL EXISTING STORED PROCEDURES
-- =============================================
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql = @sql + 'DROP PROCEDURE [' + SCHEMA_NAME(schema_id) + '].[' + name + '];' + CHAR(13)
FROM sys.procedures
WHERE name LIKE 'flow2d_%';

IF @sql != ''
BEGIN
    PRINT 'Dropping existing stored procedures...';
    EXEC sp_executesql @sql;
    PRINT 'All flow2d stored procedures dropped.';
END
ELSE
BEGIN
    PRINT 'No existing flow2d stored procedures to drop.';
END
GO

-- =============================================
-- 2. DROP EXISTING TABLES
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[flow2d_flow_saves]') AND type in (N'U'))
BEGIN
    DROP TABLE [dbo].[flow2d_flow_saves];
    PRINT 'Table [flow2d_flow_saves] dropped.';
END
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[flow2d_machine_templates]') AND type in (N'U'))
BEGIN
    DROP TABLE [dbo].[flow2d_machine_templates];
    PRINT 'Table [flow2d_machine_templates] dropped.';
END
GO

-- =============================================
-- 3. CREATE TABLE flow2d_machine_templates
-- =============================================
CREATE TABLE [dbo].[flow2d_machine_templates] (
    [id] NVARCHAR(100) PRIMARY KEY,
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
    [thumbnail] NVARCHAR(MAX) NULL,
    [shapes] NVARCHAR(MAX) NOT NULL,
    [width] INT NOT NULL DEFAULT 200,
    [height] INT NOT NULL DEFAULT 200,
    [frame_type] NVARCHAR(50) NOT NULL DEFAULT 'rectangle',
    [frame_color] NVARCHAR(20) NULL DEFAULT '#f8fafc',
    [frame_stroke_color] NVARCHAR(20) NULL DEFAULT '#3b82f6',
    [frame_stroke_width] INT NULL DEFAULT 2,
    [frame_rotation] INT NULL DEFAULT 0,
    [tags] NVARCHAR(MAX) NULL,
    [created_at] BIGINT NOT NULL,
    [updated_at] BIGINT NOT NULL,
    [created_by] NVARCHAR(255) NULL DEFAULT 'system',
    [updated_by] NVARCHAR(255) NULL DEFAULT 'system',
    [is_active] BIT NOT NULL DEFAULT 1,
    [version] INT NOT NULL DEFAULT 1,
    
    CONSTRAINT [CK_flow2d_mt_width] CHECK ([width] > 0 AND [width] <= 2000),
    CONSTRAINT [CK_flow2d_mt_height] CHECK ([height] > 0 AND [height] <= 2000),
    CONSTRAINT [CK_flow2d_mt_frame_type] CHECK (
        [frame_type] IN ('rectangle', 'rectangle2x1', 'rectangle1x2', 'circle', 'triangle')
    )
);

CREATE NONCLUSTERED INDEX [IX_flow2d_mt_name] ON [dbo].[flow2d_machine_templates]([name]);
CREATE NONCLUSTERED INDEX [IX_flow2d_mt_updated] ON [dbo].[flow2d_machine_templates]([updated_at] DESC);
CREATE NONCLUSTERED INDEX [IX_flow2d_mt_active] ON [dbo].[flow2d_machine_templates]([is_active]) WHERE [is_active] = 1;

PRINT 'Table [flow2d_machine_templates] created.';
GO

-- =============================================
-- 4. CREATE TABLE flow2d_flow_saves (LENGKAP)
-- =============================================
CREATE TABLE [dbo].[flow2d_flow_saves] (
    [id] NVARCHAR(100) PRIMARY KEY,
    [line_id] NVARCHAR(100) NOT NULL,
    [line_name] NVARCHAR(255) NULL,
    [name] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(MAX) NULL,
    [nodes] NVARCHAR(MAX) NOT NULL,
    [edges] NVARCHAR(MAX) NOT NULL,
    [node_templates] NVARCHAR(MAX) NULL,
    [formations] NVARCHAR(MAX) NULL,
    [view_mode] NVARCHAR(20) NULL DEFAULT 'default',
    [version] NVARCHAR(20) NOT NULL DEFAULT '2.0',
    [created_at] BIGINT NOT NULL,
    [updated_at] BIGINT NOT NULL,
    [created_by] NVARCHAR(255) NULL DEFAULT 'system',
    [is_active] BIT NOT NULL DEFAULT 1,
    [is_latest] BIT NOT NULL DEFAULT 1,
    
    CONSTRAINT [CK_flow2d_fs_view_mode] CHECK ([view_mode] IN ('default', 'shapes'))
);

CREATE NONCLUSTERED INDEX [IX_flow2d_fs_line_id] ON [dbo].[flow2d_flow_saves]([line_id]);
CREATE NONCLUSTERED INDEX [IX_flow2d_fs_line_latest] ON [dbo].[flow2d_flow_saves]([line_id], [is_latest]) WHERE [is_latest] = 1;
CREATE NONCLUSTERED INDEX [IX_flow2d_fs_name] ON [dbo].[flow2d_flow_saves]([name]);
CREATE NONCLUSTERED INDEX [IX_flow2d_fs_updated] ON [dbo].[flow2d_flow_saves]([updated_at] DESC);

PRINT 'Table [flow2d_flow_saves] created.';
GO

-- =============================================
-- 5. TEMPLATE STORED PROCEDURES
-- =============================================

-- 5a. Get All Templates
CREATE PROCEDURE [dbo].[flow2d_sp_GetAllTemplates]
    @IncludeInactive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        [id], [name], [description], [thumbnail], [shapes],
        [width], [height],
        [frame_type] AS frameType,
        [frame_color] AS frameColor,
        [frame_stroke_color] AS frameStrokeColor,
        [frame_stroke_width] AS frameStrokeWidth,
        [frame_rotation] AS frameRotation,
        [tags],
        [created_at] AS createdAt,
        [updated_at] AS updatedAt,
        [created_by] AS createdBy,
        [is_active] AS isActive,
        [version]
    FROM [dbo].[flow2d_machine_templates]
    WHERE @IncludeInactive = 1 OR [is_active] = 1
    ORDER BY [updated_at] DESC;
END
GO

-- 5b. Get Template By Id
CREATE PROCEDURE [dbo].[flow2d_sp_GetTemplateById]
    @TemplateId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        [id], [name], [description], [thumbnail], [shapes],
        [width], [height],
        [frame_type] AS frameType,
        [frame_color] AS frameColor,
        [frame_stroke_color] AS frameStrokeColor,
        [frame_stroke_width] AS frameStrokeWidth,
        [frame_rotation] AS frameRotation,
        [tags],
        [created_at] AS createdAt,
        [updated_at] AS updatedAt,
        [created_by] AS createdBy,
        [is_active] AS isActive,
        [version]
    FROM [dbo].[flow2d_machine_templates]
    WHERE [id] = @TemplateId;
END
GO

-- 5c. Upsert Template
CREATE PROCEDURE [dbo].[flow2d_sp_UpsertTemplate]
    @Id NVARCHAR(100),
    @Name NVARCHAR(255),
    @Description NVARCHAR(MAX) = NULL,
    @Thumbnail NVARCHAR(MAX) = NULL,
    @Shapes NVARCHAR(MAX),
    @Width INT = 200,
    @Height INT = 200,
    @FrameType NVARCHAR(50) = 'rectangle',
    @FrameColor NVARCHAR(20) = '#f8fafc',
    @FrameStrokeColor NVARCHAR(20) = '#3b82f6',
    @FrameStrokeWidth INT = 2,
    @FrameRotation INT = 0,
    @Tags NVARCHAR(MAX) = NULL,
    @UpdatedBy NVARCHAR(255) = 'system'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Now BIGINT = DATEDIFF_BIG(SECOND, '1970-01-01', GETUTCDATE()) * 1000;
    
    IF EXISTS (SELECT 1 FROM [dbo].[flow2d_machine_templates] WHERE [id] = @Id)
    BEGIN
        UPDATE [dbo].[flow2d_machine_templates]
        SET [name] = @Name, [description] = @Description, [thumbnail] = @Thumbnail,
            [shapes] = @Shapes, [width] = @Width, [height] = @Height,
            [frame_type] = @FrameType, [frame_color] = @FrameColor,
            [frame_stroke_color] = @FrameStrokeColor, [frame_stroke_width] = @FrameStrokeWidth,
            [frame_rotation] = @FrameRotation, [tags] = @Tags,
            [updated_at] = @Now, [updated_by] = @UpdatedBy, [version] = [version] + 1
        WHERE [id] = @Id;
        SELECT 'updated' AS [action], @Id AS [id];
    END
    ELSE
    BEGIN
        INSERT INTO [dbo].[flow2d_machine_templates]
            ([id], [name], [description], [thumbnail], [shapes],
             [width], [height], [frame_type], [frame_color],
             [frame_stroke_color], [frame_stroke_width], [frame_rotation],
             [tags], [created_at], [updated_at], [created_by], [updated_by])
        VALUES
            (@Id, @Name, @Description, @Thumbnail, @Shapes,
             @Width, @Height, @FrameType, @FrameColor,
             @FrameStrokeColor, @FrameStrokeWidth, @FrameRotation,
             @Tags, @Now, @Now, @UpdatedBy, @UpdatedBy);
        SELECT 'inserted' AS [action], @Id AS [id];
    END
END
GO

-- 5d. Delete Template
CREATE PROCEDURE [dbo].[flow2d_sp_DeleteTemplate]
    @TemplateId NVARCHAR(100),
    @HardDelete BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF @HardDelete = 1
        DELETE FROM [dbo].[flow2d_machine_templates] WHERE [id] = @TemplateId;
    ELSE
    BEGIN
        DECLARE @Now BIGINT = DATEDIFF_BIG(SECOND, '1970-01-01', GETUTCDATE()) * 1000;
        UPDATE [dbo].[flow2d_machine_templates] SET [is_active] = 0, [updated_at] = @Now WHERE [id] = @TemplateId;
    END
    SELECT @@ROWCOUNT AS [affected_rows];
END
GO

-- 5e. Duplicate Template
CREATE PROCEDURE [dbo].[flow2d_sp_DuplicateTemplate]
    @SourceId NVARCHAR(100),
    @NewId NVARCHAR(100),
    @NewName NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Now BIGINT = DATEDIFF_BIG(SECOND, '1970-01-01', GETUTCDATE()) * 1000;
    
    INSERT INTO [dbo].[flow2d_machine_templates]
        ([id], [name], [description], [thumbnail], [shapes],
         [width], [height], [frame_type], [frame_color],
         [frame_stroke_color], [frame_stroke_width], [frame_rotation],
         [tags], [created_at], [updated_at], [created_by], [updated_by],
         [is_active], [version])
    SELECT @NewId, @NewName, [description], [thumbnail], [shapes],
           [width], [height], [frame_type], [frame_color],
           [frame_stroke_color], [frame_stroke_width], [frame_rotation],
           [tags], @Now, @Now, [created_by], [created_by], 1, 1
    FROM [dbo].[flow2d_machine_templates] WHERE [id] = @SourceId;
    
    SELECT @@ROWCOUNT AS [affected_rows], @NewId AS [new_id];
END
GO

PRINT 'Template stored procedures created.';
GO

-- =============================================
-- 6. FLOW SAVES STORED PROCEDURES
-- =============================================

-- 6a. Save Flow By Line
CREATE PROCEDURE [dbo].[flow2d_sp_SaveFlowByLine]
    @Id NVARCHAR(100),
    @LineId NVARCHAR(100),
    @LineName NVARCHAR(255) = NULL,
    @Name NVARCHAR(255),
    @Description NVARCHAR(MAX) = NULL,
    @Nodes NVARCHAR(MAX),
    @Edges NVARCHAR(MAX),
    @NodeTemplates NVARCHAR(MAX) = NULL,
    @Formations NVARCHAR(MAX) = NULL,
    @ViewMode NVARCHAR(20) = 'default',
    @CreatedBy NVARCHAR(255) = 'system'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Now BIGINT = DATEDIFF_BIG(SECOND, '1970-01-01', GETUTCDATE()) * 1000;
    
    -- Set previous versions as not latest
    UPDATE [dbo].[flow2d_flow_saves]
    SET [is_latest] = 0, [updated_at] = @Now
    WHERE [line_id] = @LineId AND [is_latest] = 1;
    
    -- Insert new version
    INSERT INTO [dbo].[flow2d_flow_saves]
        ([id], [line_id], [line_name], [name], [description],
         [nodes], [edges], [node_templates], [formations],
         [view_mode], [created_at], [updated_at], [created_by],
         [is_active], [is_latest])
    VALUES
        (@Id, @LineId, @LineName, @Name, @Description,
         @Nodes, @Edges, @NodeTemplates, @Formations,
         @ViewMode, @Now, @Now, @CreatedBy, 1, 1);
    
    SELECT 'saved' AS [action], @Id AS [id], @LineId AS [line_id], @Now AS [saved_at];
END
GO

-- 6b. Get Flow By Line ID
CREATE PROCEDURE [dbo].[flow2d_sp_GetFlowByLineId]
    @LineId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1
        [id], [line_id] AS lineId, [line_name] AS lineName,
        [name], [description], [nodes], [edges],
        [node_templates] AS nodeTemplates, [formations],
        [view_mode] AS viewMode, [version],
        [created_at] AS createdAt, [updated_at] AS updatedAt,
        [created_by] AS createdBy, [is_active] AS isActive,
        [is_latest] AS isLatest
    FROM [dbo].[flow2d_flow_saves]
    WHERE [line_id] = @LineId AND [is_active] = 1 AND [is_latest] = 1
    ORDER BY [updated_at] DESC;
END
GO

-- 6c. Get Flow History By Line ID
CREATE PROCEDURE [dbo].[flow2d_sp_GetFlowHistoryByLineId]
    @LineId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        [id], [line_id] AS lineId, [line_name] AS lineName,
        [name], [description], [nodes], [edges],
        [node_templates] AS nodeTemplates, [formations],
        [view_mode] AS viewMode, [version],
        [created_at] AS createdAt, [updated_at] AS updatedAt,
        [created_by] AS createdBy, [is_active] AS isActive,
        [is_latest] AS isLatest
    FROM [dbo].[flow2d_flow_saves]
    WHERE [line_id] = @LineId
    ORDER BY [updated_at] DESC;
END
GO

-- 6d. Get All Saved Lines
CREATE PROCEDURE [dbo].[flow2d_sp_GetAllSavedLines]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        [line_id] AS lineId,
        MAX([line_name]) AS lineName,
        MAX([name]) AS flowName,
        MAX([updated_at]) AS lastUpdated,
        COUNT(*) AS versionCount,
        MAX(CASE WHEN [is_latest] = 1 THEN [id] END) AS latestFlowId
    FROM [dbo].[flow2d_flow_saves]
    WHERE [is_active] = 1
    GROUP BY [line_id]
    ORDER BY MAX([updated_at]) DESC;
END
GO

-- 6e. Delete Flow By Line ID
CREATE PROCEDURE [dbo].[flow2d_sp_DeleteFlowByLineId]
    @LineId NVARCHAR(100),
    @HardDelete BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF @HardDelete = 1
        DELETE FROM [dbo].[flow2d_flow_saves] WHERE [line_id] = @LineId;
    ELSE
    BEGIN
        DECLARE @Now BIGINT = DATEDIFF_BIG(SECOND, '1970-01-01', GETUTCDATE()) * 1000;
        UPDATE [dbo].[flow2d_flow_saves] SET [is_active] = 0, [updated_at] = @Now WHERE [line_id] = @LineId;
    END
    SELECT @@ROWCOUNT AS [affected_rows];
END
GO

PRINT 'Flow saves stored procedures created.';
GO

-- =============================================
-- 7. VERIFICATION
-- =============================================
PRINT '';
PRINT '========================================';
PRINT '  VERIFICATION';
PRINT '========================================';

-- Check tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE 'flow2d_%' ORDER BY TABLE_NAME;

-- Check stored procedures
SELECT name FROM sys.procedures 
WHERE name LIKE 'flow2d_%' ORDER BY name;

PRINT '';
PRINT '========================================';
PRINT '  ✅ ALL DONE - Database ready!';
PRINT '========================================';
GO