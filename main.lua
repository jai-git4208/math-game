local player = {
    x = 0, y = 1.6, z = -5,
    angle = 0,
    bob = 0,
    bobSpeed = 0,
    speed = 8,
    rotSpeed = 2.5
}

local pages = {
    { text = "Long ago, a party of heroes saved the world.", bg = "party_heroes" },
    { text = "The demon king fell. People celebrated.", bg = "party_victory" },
    { text = "Songs were sung very loudly.", bg = "party_songs" },
    { text = "Statues were carved in places no one visits anymore.", bg = "statue_abandoned" },
    { text = "Then time moved on. Like it always does.", bg = "time_pass" },
    { text = "You are Aeris, an elf mage.", bg = "travel_elf" },
    { text = "You age slowly... until everyone you know doesn’t.", bg = "time_age" },
    { text = "Centuries pass like badly written diary pages.", bg = "time_diary" },
    { text = "You also don’t travel alone anymore.", bg = "travel_companion" },
    { text = "At some point, you picked up a small companion.", bg = "travel_companion" },
    { text = "They’re cheerful. A little stupid. Kind of a cupcake of a person.", bg = "travel_cupcake" },
    { text = "They make the long years feel shorter.", bg = "travel_companion" },
    { text = "The warrior is a name carved into stone.", bg = "hero_warrior" },
    { text = "The priest exists only in stories that change.", bg = "hero_priest" },
    { text = "The mathematician-sage is forgotten entirely.", bg = "hero_sage" },
    { text = "That part still bothers you. Only you remain.", bg = "hero_remain" },
    { text = "The world is peaceful. Too peaceful.", bg = "time_peace" },
    { text = "You stand in front of an old statue.\nIts inscription has faded.", bg = "statue_faded" },
    { text = "You try to remember who it honored.\nYou cannot.", bg = "statue_forgotten" },
    { text = "You pretend that doesn’t hurt.", bg = "statue_pain" }
}

local currentPage = 1
local time = 0
local storyFont
local promptFont

-- 3D Core Mathematics (Corrected for FPS movement)
local function project(x, y, z)
    local camX, camY = player.x, player.y + math.sin(player.bob) * 0.12
    local camZ = player.z
    local angle = player.angle

    -- World to Camera space
    local rx, ry, rz = x - camX, y - camY, z - camZ

    -- Rotate world around camera Y-axis (Yaw)
    -- We negate the angle because we are rotating the world in the opposite direction of the camera
    local cs, sn = math.cos(-angle), math.sin(-angle)
    local tx = rx * cs - rz * sn
    local tz = rx * sn + rz * cs
    
    -- Near plane clipping
    if tz <= 0.2 then return -10000, -10000, tz end

    local factor = 500 / tz
    local x_proj = tx * factor + love.graphics.getWidth() / 2
    local y_proj = ry * factor + love.graphics.getHeight() / 2
    return x_proj, y_proj, tz
end

-- Shape Helpers
local function drawLine3D(x1, y1, z1, x2, y2, z2)
    local px1, py1, d1 = project(x1, y1, z1)
    local px2, py2, d2 = project(x2, y2, z2)
    if d1 > 0.2 and d2 > 0.2 then
        love.graphics.line(px1, py1, px2, py2)
    end
end

local function drawCube(size, x, y, z, rx, ry, rz)
    local s = size / 2
    local function rotatePoint(px, py, pz)
        local x1, y1, z1 = px, py, pz
        if rx then
            local ty, tz = y1 * math.cos(rx) - z1 * math.sin(rx), y1 * math.sin(rx) + z1 * math.cos(rx)
            y1, z1 = ty, tz
        end
        if ry then
            local tx, tz = x1 * math.cos(ry) + z1 * math.sin(ry), -x1 * math.sin(ry) + z1 * math.cos(ry)
            x1, z1 = tx, tz
        end
        if rz then
            local tx, ty = x1 * math.cos(rz) - y1 * math.sin(rz), x1 * math.sin(rz) + y1 * math.cos(rz)
            x1, y1 = tx, ty
        end
        return x1 + x, y1 + y, z1 + z
    end

    local points = {
        {-s,-s,-s}, {s,-s,-s}, {s,s,-s}, {-s,s,-s},
        {-s,-s,s}, {s,-s,s}, {s,s,s}, {-s,s,s}
    }
    local transformed = {}
    for i, p in ipairs(points) do
        local tx, ty, tz = rotatePoint(p[1], p[2], p[3])
        transformed[i] = {tx, ty, tz}
    end

    local function line(a, b) drawLine3D(transformed[a][1], transformed[a][2], transformed[a][3], transformed[b][1], transformed[b][2], transformed[b][3]) end
    line(1,2) line(2,3) line(3,4) line(4,1)
    line(5,6) line(6,7) line(7,8) line(8,5)
    line(1,5) line(2,6) line(3,7) line(4,8)
end

local function drawTree(x, z, h)
    love.graphics.setColor(0.4, 0.2, 0.1, 0.5)
    drawLine3D(x, 4, z, x, 4-h, z)
    love.graphics.setColor(0, 0.8, 0.3, 0.3)
    for i = 1, 3 do
        local y = 4 - h + i * 1.5
        drawCube(2.5 - i * 0.5, x, y, z, 0, time + i, 0)
    end
end

local function drawSky(c1, c2)
    local h = love.graphics.getHeight()
    local w = love.graphics.getWidth()
    for i = 0, h/2 do
        local t = i / (h/2)
        love.graphics.setColor(c1[1]*(1-t)+c2[1]*t, c1[2]*(1-t)+c2[2]*t, c1[3]*(1-t)+c2[3]*t)
        love.graphics.line(0, i, w, i)
    end
    love.graphics.setColor(0.1, 0.15, 0.1)
    love.graphics.rectangle("fill", 0, h/2, w, h/2)
end

local scenes = {
    party_heroes = function(t)
        drawSky({0.1, 0.1, 0.3}, {0.2, 0, 0.2})
        love.graphics.setColor(1, 1, 1, 0.6)
        drawCube(2, -5, 2, 10, 0, t, 0)
        drawCube(1, 0, 1, 15, t, 0, t)
        drawCube(3, 5, 2, 8, 0, 0, t)
    end,
    statue_abandoned = function(t)
        drawSky({0.3, 0.3, 0.4}, {0.1, 0.1, 0.2})
        for i = -2, 2 do
            for j = 1, 3 do
                drawTree(i * 20, j * 20 + 10, 5)
            end
        end
        love.graphics.setColor(0.4, 0.4, 0.4, 0.6)
        drawCube(5, 0, 1.5, 40, 0, 0, 0)
    end,
    travel_companion = function(t)
        drawSky({0.4, 0.6, 1}, {0.2, 0.4, 0.8})
        for j = 1, 5 do
            drawTree(-15, j * 15, 4)
            drawTree(15, j * 15, 4)
        end
        love.graphics.setColor(1, 0.6, 0.9, 0.7)
        local jump = math.abs(math.sin(t*5)) * 1.5
        drawCube(1, 4, 3-jump, 12, 0, t, 0)
    end,
    _default = function(t)
        drawSky({0.1, 0.1, 0.2}, {0, 0, 0.1})
        love.graphics.setColor(1, 1, 1, 0.1)
        for i = 1, 8 do
            drawCube(2, math.sin(i)*15, 3, i*12, 0, t, 0)
        end
    end
}

function love.load()
    love.window.setTitle("Eternal Equation - First Person")
    storyFont = love.graphics.newFont(24)
    promptFont = love.graphics.newFont(16)
end

function love.update(dt)
    time = time + dt
    local moving = false
    
    -- Rotation (A=Left, D=Right)
    if love.keyboard.isDown("a") then player.angle = player.angle - player.rotSpeed * dt end
    if love.keyboard.isDown("d") then player.angle = player.angle + player.rotSpeed * dt end

    -- Movement (W=Forward, S=Backward)
    -- The movement vector MUST match the camera projection logic
    local dx = math.sin(player.angle)
    local dz = math.cos(player.angle)

    if love.keyboard.isDown("w") then
        player.x = player.x + dx * player.speed * dt
        player.z = player.z + dz * player.speed * dt
        moving = true
    end
    if love.keyboard.isDown("s") then
        player.x = player.x - dx * player.speed * dt
        player.z = player.z - dz * player.speed * dt
        moving = true
    end

    -- Head Bob
    if moving then
        player.bobSpeed = math.min(player.bobSpeed + dt * 10, 1)
    else
        player.bobSpeed = math.max(player.bobSpeed - dt * 5, 0)
    end
    player.bob = player.bob + dt * 12 * player.bobSpeed
end

function love.draw()
    local bg = scenes[pages[currentPage].bg] or scenes._default
    bg(time)

    local w, h = love.graphics.getDimensions()
    love.graphics.setColor(0, 0, 0, 0.8)
    love.graphics.rectangle("fill", 40, h-170, w-80, 130, 20, 20)
    love.graphics.setColor(1, 1, 1)
    love.graphics.setFont(storyFont)
    love.graphics.printf(pages[currentPage].text, 60, h-140, w-120, "center")
    love.graphics.setFont(promptFont)
    love.graphics.setColor(0.6, 0.6, 0.8)
    love.graphics.printf("WASD to Walk. Any Key to Next.", 0, h-30, w, "center")
end

function love.keypressed(key)
    if key == "escape" then love.event.quit()
    elseif not (key=="w" or key=="a" or key=="s" or key=="d") then
        currentPage = (currentPage % #pages) + 1
        player.x, player.z = 0, -5
    end
end
